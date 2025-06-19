"""
오디오 전처리 서비스

Voice Cloning을 위한 최적의 음성 샘플을 만들기 위한 전처리 기능들
"""
import numpy as np
import librosa
import soundfile as sf
import noisereduce as nr
from scipy.signal import butter, lfilter, savgol_filter
from scipy.ndimage import median_filter
import pyloudnorm as pyln
from typing import Optional, Tuple, Dict, Any, List
import logging
from pathlib import Path
import json

logger = logging.getLogger(__name__)


class AudioPreprocessor:
    """Voice Cloning을 위한 오디오 전처리 클래스"""
    
    def __init__(self, target_sr: int = 22050, target_lufs: float = -23.0):
        """
        Args:
            target_sr: 목표 샘플링 레이트 (기본값: 22050Hz - Coqui TTS 권장)
            target_lufs: 목표 LUFS (Loudness Units relative to Full Scale) 값
        """
        self.target_sr = target_sr
        self.target_lufs = target_lufs
        self.meter = pyln.Meter(target_sr)  # 라우드니스 미터
        
    def process_audio(
        self,
        input_path: str,
        output_path: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        음성 파일을 Voice Cloning에 최적화된 형태로 전처리
        
        Args:
            input_path: 입력 오디오 파일 경로
            output_path: 출력 오디오 파일 경로
            config: 전처리 설정 (선택사항)
            
        Returns:
            전처리 결과 정보
        """
        # 기본 설정
        default_config = {
            "denoise": True,
            "denoise_strength": 0.7,
            "trim_silence": True,
            "silence_threshold": -40,  # dB
            "normalize": True,
            "remove_low_freq": True,
            "low_freq_cutoff": 80,  # Hz
            "remove_high_freq": True,
            "high_freq_cutoff": 8000,  # Hz
            "apply_compression": True,
            "compression_ratio": 0.8,
            "enhance_clarity": True
        }
        
        if config:
            default_config.update(config)
        config = default_config
        
        try:
            # 1. 오디오 파일 로드
            audio, sr = librosa.load(input_path, sr=None, mono=True)
            logger.info(f"로드된 오디오: {len(audio)} 샘플, {sr}Hz")
            
            # 2. 리샘플링 (필요한 경우)
            if sr != self.target_sr:
                audio = librosa.resample(audio, orig_sr=sr, target_sr=self.target_sr)
                sr = self.target_sr
                logger.info(f"리샘플링 완료: {self.target_sr}Hz")
            
            # 3. 노이즈 제거
            if config["denoise"]:
                audio = self._denoise_audio(audio, sr, config["denoise_strength"])
                logger.info("노이즈 제거 완료")
            
            # 4. 침묵 구간 제거
            if config["trim_silence"]:
                audio = self._trim_silence(audio, sr, config["silence_threshold"])
                logger.info("침묵 구간 제거 완료")
            
            # 5. 주파수 필터링
            if config["remove_low_freq"] or config["remove_high_freq"]:
                audio = self._apply_frequency_filter(
                    audio, sr,
                    config["low_freq_cutoff"] if config["remove_low_freq"] else None,
                    config["high_freq_cutoff"] if config["remove_high_freq"] else None
                )
                logger.info("주파수 필터링 완료")
            
            # 6. 다이나믹 레인지 압축
            if config["apply_compression"]:
                audio = self._apply_compression(audio, config["compression_ratio"])
                logger.info("다이나믹 레인지 압축 완료")
            
            # 7. 음성 명료도 향상
            if config["enhance_clarity"]:
                audio = self._enhance_clarity(audio, sr)
                logger.info("음성 명료도 향상 완료")
            
            # 8. 라우드니스 정규화 (LUFS 기준)
            if config["normalize"]:
                audio = self._normalize_loudness(audio, sr)
                logger.info(f"라우드니스 정규화 완료: {self.target_lufs} LUFS")
            
            # 9. 클리핑 방지
            audio = self._prevent_clipping(audio)
            
            # 10. 저장
            sf.write(output_path, audio, sr, subtype='PCM_16')
            logger.info(f"전처리된 오디오 저장 완료: {output_path}")
            
            # 결과 분석
            result = self._analyze_audio(audio, sr)
            result["config"] = config
            result["input_file"] = input_path
            result["output_file"] = output_path
            
            return result
            
        except Exception as e:
            logger.error(f"오디오 전처리 중 오류 발생: {str(e)}")
            raise
    
    def _denoise_audio(
        self,
        audio: np.ndarray,
        sr: int,
        strength: float = 0.7
    ) -> np.ndarray:
        """고급 노이즈 제거"""
        # stationary noise reduction
        denoised = nr.reduce_noise(
            y=audio,
            sr=sr,
            stationary=True,
            prop_decrease=strength
        )
        
        # 추가적인 median 필터로 클릭 노이즈 제거
        denoised = median_filter(denoised, size=3)
        
        return denoised
    
    def _trim_silence(
        self,
        audio: np.ndarray,
        sr: int,
        threshold_db: float = -40
    ) -> np.ndarray:
        """침묵 구간 제거 (시작과 끝)"""
        # 침묵 구간 찾기
        intervals = librosa.effects.split(
            audio,
            top_db=-threshold_db,
            frame_length=2048,
            hop_length=512
        )
        
        if len(intervals) > 0:
            # 유효한 구간들을 연결
            trimmed_audio = []
            for start, end in intervals:
                trimmed_audio.append(audio[start:end])
            
            # 구간 사이에 짧은 침묵 추가 (자연스러운 연결)
            silence_duration = int(0.1 * sr)  # 0.1초
            silence = np.zeros(silence_duration)
            
            result = []
            for i, segment in enumerate(trimmed_audio):
                result.append(segment)
                if i < len(trimmed_audio) - 1:
                    result.append(silence)
            
            return np.concatenate(result)
        
        return audio
    
    def _apply_frequency_filter(
        self,
        audio: np.ndarray,
        sr: int,
        low_cutoff: Optional[float] = None,
        high_cutoff: Optional[float] = None
    ) -> np.ndarray:
        """주파수 대역 필터링"""
        nyquist = sr / 2
        
        if low_cutoff and high_cutoff:
            # 밴드패스 필터
            low = low_cutoff / nyquist
            high = high_cutoff / nyquist
            b, a = butter(4, [low, high], btype='band')
        elif low_cutoff:
            # 하이패스 필터
            low = low_cutoff / nyquist
            b, a = butter(4, low, btype='high')
        elif high_cutoff:
            # 로우패스 필터
            high = high_cutoff / nyquist
            b, a = butter(4, high, btype='low')
        else:
            return audio
        
        # 필터 적용
        filtered = lfilter(b, a, audio)
        
        # 위상 왜곡 보정을 위해 역방향 필터링도 적용
        filtered = lfilter(b, a, filtered[::-1])[::-1]
        
        return filtered
    
    def _apply_compression(
        self,
        audio: np.ndarray,
        ratio: float = 0.8
    ) -> np.ndarray:
        """다이나믹 레인지 압축"""
        # RMS 계산
        frame_length = 2048
        hop_length = 512
        rms = librosa.feature.rms(
            y=audio,
            frame_length=frame_length,
            hop_length=hop_length
        )[0]
        
        # 스무딩
        rms_smooth = savgol_filter(rms, 31, 3)
        
        # 압축 커브 적용
        threshold = np.percentile(rms_smooth, 70)
        gain = np.ones_like(rms_smooth)
        
        above_threshold = rms_smooth > threshold
        gain[above_threshold] = (
            threshold / rms_smooth[above_threshold]
        ) ** (1 - ratio)
        
        # 게인 적용
        gain_interp = np.interp(
            np.arange(len(audio)),
            np.arange(len(gain)) * hop_length,
            gain
        )
        
        compressed = audio * gain_interp
        
        return compressed
    
    def _enhance_clarity(
        self,
        audio: np.ndarray,
        sr: int
    ) -> np.ndarray:
        """음성 명료도 향상"""
        # 1. 스펙트럴 센트로이드 기반 향상
        spectral_centroids = librosa.feature.spectral_centroid(
            y=audio, sr=sr
        )[0]
        
        # 2. 포먼트 강조 (2-4kHz 대역)
        formant_enhanced = self._apply_frequency_filter(
            audio, sr, 2000, 4000
        )
        
        # 3. 원본과 블렌딩
        blend_ratio = 0.3
        enhanced = audio * (1 - blend_ratio) + formant_enhanced * blend_ratio
        
        # 4. 미세한 하모닉 향상
        harmonic, percussive = librosa.effects.hpss(enhanced)
        enhanced = harmonic * 1.1 + percussive * 0.9
        
        return enhanced
    
    def _normalize_loudness(
        self,
        audio: np.ndarray,
        sr: int
    ) -> np.ndarray:
        """LUFS 기준 라우드니스 정규화"""
        # 현재 라우드니스 측정
        loudness = self.meter.integrated_loudness(audio)
        
        # 정규화 게인 계산
        loudness_gain_db = self.target_lufs - loudness
        loudness_gain = 10.0 ** (loudness_gain_db / 20.0)
        
        # 게인 적용
        normalized = audio * loudness_gain
        
        return normalized
    
    def _prevent_clipping(
        self,
        audio: np.ndarray,
        headroom_db: float = -0.3
    ) -> np.ndarray:
        """클리핑 방지"""
        # 피크 레벨 확인
        peak = np.max(np.abs(audio))
        
        # 헤드룸 확보
        max_level = 10 ** (headroom_db / 20.0)
        
        if peak > max_level:
            audio = audio * (max_level / peak)
        
        # 소프트 리미터 적용
        audio = np.tanh(audio * 0.8) / 0.8
        
        return audio
    
    def _analyze_audio(
        self,
        audio: np.ndarray,
        sr: int
    ) -> Dict[str, Any]:
        """오디오 분석 정보 생성"""
        # 기본 정보
        duration = len(audio) / sr
        
        # 라우드니스 분석
        loudness = self.meter.integrated_loudness(audio)
        
        # 주파수 분석
        spectral_centroid = np.mean(
            librosa.feature.spectral_centroid(y=audio, sr=sr)
        )
        
        # RMS 에너지
        rms = np.sqrt(np.mean(audio ** 2))
        
        # 신호 대 잡음비 추정
        noise_floor = np.percentile(np.abs(audio), 10)
        signal_peak = np.percentile(np.abs(audio), 90)
        snr_estimate = 20 * np.log10(signal_peak / (noise_floor + 1e-10))
        
        return {
            "duration_seconds": round(duration, 2),
            "sample_rate": sr,
            "loudness_lufs": round(loudness, 2),
            "spectral_centroid_hz": round(spectral_centroid, 2),
            "rms_energy": round(float(rms), 4),
            "snr_estimate_db": round(snr_estimate, 2),
            "peak_level": round(float(np.max(np.abs(audio))), 4),
            "quality_score": self._calculate_quality_score(
                loudness, snr_estimate, duration
            )
        }
    
    def _calculate_quality_score(
        self,
        loudness: float,
        snr: float,
        duration: float
    ) -> float:
        """Voice Cloning 적합성 점수 계산 (0-100)"""
        scores = []
        
        # 라우드니스 점수 (목표값에 가까울수록 높은 점수)
        loudness_diff = abs(loudness - self.target_lufs)
        loudness_score = max(0, 100 - loudness_diff * 5)
        scores.append(loudness_score)
        
        # SNR 점수 (높을수록 좋음)
        snr_score = min(100, max(0, snr * 2))
        scores.append(snr_score)
        
        # 길이 점수 (3-30초가 이상적)
        if 3 <= duration <= 30:
            duration_score = 100
        elif duration < 3:
            duration_score = duration / 3 * 100
        else:
            duration_score = max(0, 100 - (duration - 30) * 2)
        scores.append(duration_score)
        
        # 가중 평균
        weights = [0.3, 0.5, 0.2]  # 라우드니스, SNR, 길이
        final_score = sum(s * w for s, w in zip(scores, weights))
        
        return round(final_score, 1)
    
    def batch_process(
        self,
        input_dir: str,
        output_dir: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """여러 파일 일괄 처리"""
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        results = {}
        
        # 지원하는 오디오 확장자
        audio_extensions = {'.wav', '.mp3', '.flac', '.ogg', '.m4a'}
        
        for audio_file in input_path.iterdir():
            if audio_file.suffix.lower() in audio_extensions:
                try:
                    output_file = output_path / f"{audio_file.stem}_processed.wav"
                    result = self.process_audio(
                        str(audio_file),
                        str(output_file),
                        config
                    )
                    results[audio_file.name] = result
                    logger.info(f"처리 완료: {audio_file.name}")
                except Exception as e:
                    logger.error(f"파일 처리 실패 {audio_file.name}: {str(e)}")
                    results[audio_file.name] = {"error": str(e)}
        
        # 결과 저장
        result_file = output_path / "preprocessing_results.json"
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        return results
    
    def preprocess_for_voice_cloning(
        self,
        input_path: str,
        apply_all: bool = True,
        output_path: Optional[str] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """Voice Cloning에 최적화된 전처리를 수행합니다."""
        if output_path is None:
            input_p = Path(input_path)
            output_dir = Path("preprocessed_audio")
            output_dir.mkdir(exist_ok=True)
            output_path = str(output_dir / f"{input_p.stem}_processed.wav")
        
        config = {
            "denoise": apply_all,
            "denoise_strength": 0.7,
            "trim_silence": apply_all,
            "silence_threshold": -40,
            "normalize": apply_all,
            "remove_low_freq": apply_all,
            "low_freq_cutoff": 80,
            "remove_high_freq": apply_all,
            "high_freq_cutoff": 8000,
            "apply_compression": apply_all,
            "compression_ratio": 0.8,
            "enhance_clarity": apply_all
        }
        
        result = self.process_audio(input_path, output_path, config)
        
        processing_info = {
            "applied_processes": [
                key for key, value in config.items() 
                if value is True and not key.endswith("_cutoff") and not key.endswith("_threshold")
            ],
            "quality_score": result.get("quality_score", 0),
            "duration": result.get("duration_seconds", 0),
            "sample_rate": result.get("sample_rate", self.target_sr)
        }
        
        return output_path, processing_info
    
    def analyze_audio(self, file_path: str) -> Dict[str, Any]:
        """오디오 파일을 분석합니다."""
        try:
            # 오디오 로드
            audio, sr = librosa.load(file_path, sr=None, mono=False)
            
            # 모노로 변환 (스테레오인 경우)
            if audio.ndim > 1:
                audio_mono = librosa.to_mono(audio)
                channels = audio.shape[0]
            else:
                audio_mono = audio
                channels = 1
            
            # 기본 정보
            duration = len(audio_mono) / sr
            
            # 진폭 분석
            peak_amplitude = np.max(np.abs(audio_mono))
            rms_level = np.sqrt(np.mean(audio_mono ** 2))
            db_level = 20 * np.log10(rms_level + 1e-10)
            
            # 클리핑 검사
            clipping_samples = np.sum(np.abs(audio_mono) >= 0.99)
            
            # 침묵 비율 계산
            silence_threshold = 0.01
            silence_samples = np.sum(np.abs(audio_mono) < silence_threshold)
            silence_ratio = silence_samples / len(audio_mono)
            
            # 주파수 분석
            spectral_centroid = np.mean(
                librosa.feature.spectral_centroid(y=audio_mono, sr=sr)
            )
            
            # 품질 점수 계산
            quality_score = self._calculate_quality_score_from_analysis(
                db_level, silence_ratio, duration, clipping_samples, peak_amplitude
            )
            
            return {
                "sample_rate": sr,
                "duration": duration,
                "channels": channels,
                "peak_amplitude": float(peak_amplitude),
                "rms_level": float(rms_level),
                "db_level": float(db_level),
                "clipping_samples": int(clipping_samples),
                "silence_ratio": float(silence_ratio),
                "spectral_centroid": float(spectral_centroid),
                "quality_score": quality_score
            }
            
        except Exception as e:
            logger.error(f"Audio analysis failed: {e}")
            raise
    
    def recommend_improvements(self, analysis: Dict[str, Any]) -> List[str]:
        """분석 결과를 바탕으로 개선 사항을 추천합니다."""
        recommendations = []
        
        # 볼륨 레벨 체크
        if analysis["db_level"] < -30:
            recommendations.append("🔊 볼륨이 너무 낮습니다. 정규화를 권장합니다.")
        elif analysis["db_level"] > -10:
            recommendations.append("🔊 볼륨이 너무 높습니다. 압축을 권장합니다.")
        
        # 클리핑 체크
        if analysis["clipping_samples"] > 0:
            recommendations.append("⚠️ 클리핑이 감지되었습니다. 볼륨을 낮추세요.")
        
        # 침묵 비율 체크
        if analysis["silence_ratio"] > 0.3:
            recommendations.append("🤫 침묵 구간이 많습니다. 트리밍을 권장합니다.")
        
        # 길이 체크
        if analysis["duration"] < 3:
            recommendations.append("⏱️ 너무 짧습니다. 3초 이상의 샘플을 권장합니다.")
        elif analysis["duration"] > 30:
            recommendations.append("⏱️ 너무 깁니다. 30초 이내로 편집하세요.")
        
        # 샘플레이트 체크
        if analysis["sample_rate"] != 22050:
            recommendations.append(f"🎵 샘플레이트를 22050Hz로 변경을 권장합니다. (현재: {analysis['sample_rate']}Hz)")
        
        # 품질 점수 기반 추천
        if analysis["quality_score"] < 70:
            recommendations.append("🎯 전체적인 품질 개선이 필요합니다. 전처리를 적용하세요.")
        elif analysis["quality_score"] >= 90:
            recommendations.append("✨ 우수한 품질입니다! Voice Cloning에 적합합니다.")
        
        return recommendations
    
    def _calculate_quality_score_from_analysis(
        self,
        db_level: float,
        silence_ratio: float,
        duration: float,
        clipping_samples: int,
        peak_amplitude: float
    ) -> float:
        """분석 결과로부터 품질 점수 계산"""
        scores = []
        
        # 볼륨 점수 (목표: -23dB)
        volume_diff = abs(db_level - (-23))
        volume_score = max(0, 100 - volume_diff * 3)
        scores.append(volume_score)
        
        # 침묵 비율 점수
        silence_score = max(0, 100 - silence_ratio * 200)
        scores.append(silence_score)
        
        # 길이 점수
        if 3 <= duration <= 30:
            duration_score = 100
        elif duration < 3:
            duration_score = duration / 3 * 100
        else:
            duration_score = max(0, 100 - (duration - 30) * 2)
        scores.append(duration_score)
        
        # 클리핑 점수
        if clipping_samples == 0:
            clipping_score = 100
        else:
            clipping_score = max(0, 100 - clipping_samples / 100)
        scores.append(clipping_score)
        
        # 피크 레벨 점수
        if 0.3 <= peak_amplitude <= 0.95:
            peak_score = 100
        elif peak_amplitude < 0.3:
            peak_score = peak_amplitude / 0.3 * 100
        else:
            peak_score = max(0, 100 - (peak_amplitude - 0.95) * 200)
        scores.append(peak_score)
        
        # 가중 평균
        weights = [0.2, 0.2, 0.2, 0.2, 0.2]
        final_score = sum(s * w for s, w in zip(scores, weights))
        
        return round(final_score, 1)


# 싱글톤 인스턴스 생성
audio_preprocessor = AudioPreprocessor()
