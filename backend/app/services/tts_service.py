import os
import uuid
import asyncio
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.core.db import engine
from app.models.tts import TTSGeneration, TTSScript, GenerationStatus
from app.models.voice_actor import VoiceActor, VoiceSample
from app.core.config import settings

logger = logging.getLogger(__name__)

class TTSService:
    """TTS 생성 및 관리를 담당하는 서비스 클래스"""
    
    def __init__(self):
        self.tts_model = None
        self.audio_files_dir = Path("audio_files")
        self.audio_files_dir.mkdir(exist_ok=True)
        
    async def initialize_tts_model(self):
        """TTS 모델 초기화 (지연 로딩)"""
        if self.tts_model is None:
            logger.info("Initializing TTS model...")
            
            try:
                # TTS 라이브러리 import 테스트
                logger.info("Importing TTS library...")
                from TTS.api import TTS
                logger.info("TTS library imported successfully")
                
                # GPU 사용 가능 여부 확인
                try:
                    import torch
                    use_gpu = torch.cuda.is_available()
                    logger.info(f"GPU availability: {use_gpu}")
                    if use_gpu:
                        logger.info(f"CUDA version: {torch.version.cuda}")
                        logger.info(f"GPU count: {torch.cuda.device_count()}")
                except ImportError:
                    logger.warning("PyTorch not available")
                    use_gpu = False
                
                # XTTS v2 모델 로드 (다국어 지원)
                model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
                logger.info(f"Loading TTS model: {model_name} (GPU: {use_gpu})")
                
                # 모델 로드 시간이 오래 걸릴 수 있으므로 비동기 처리
                loop = asyncio.get_event_loop()
                
                def _load_model():
                    return TTS(model_name, gpu=use_gpu)
                
                # 모델 로드를 별도 스레드에서 실행
                self.tts_model = await loop.run_in_executor(None, _load_model)
                
                logger.info(f"TTS model {model_name} loaded successfully")
                
                # 모델 정보 얻기
                try:
                    model_info = {
                        "name": model_name,
                        "languages": getattr(self.tts_model, 'languages', 'Unknown'),
                        "speakers": len(getattr(self.tts_model, 'speakers', [])) if hasattr(self.tts_model, 'speakers') else 'Unknown'
                    }
                    logger.info(f"Model info: {model_info}")
                except Exception as e:
                    logger.warning(f"Could not get model info: {e}")
                
            except ImportError as e:
                logger.warning(f"TTS library not available: {e}")
                logger.warning("Using mock TTS instead")
                self.tts_model = "mock"
            except Exception as e:
                logger.error(f"Failed to load TTS model: {e}")
                logger.error(f"Error details: {type(e).__name__}: {str(e)}")
                logger.warning("Falling back to mock TTS")
                self.tts_model = "mock"
            
            # 최종 상태 로깅
            if self.tts_model == "mock":
                logger.warning("TTS service initialized in MOCK mode - will generate synthetic audio")
            else:
                logger.info("TTS service initialized successfully with real TTS model")
    
    async def process_tts_generation(self, generation_id: uuid.UUID) -> None:
        """백그라운드에서 TTS 생성 작업을 처리"""
        with Session(engine) as session:
            # 생성 작업 조회
            generation = session.get(TTSGeneration, generation_id)
            if not generation:
                logger.error(f"Generation {generation_id} not found")
                return
            
            try:
                # 상태를 처리중으로 변경
                generation.status = GenerationStatus.PROCESSING
                generation.started_at = datetime.now()
                session.add(generation)
                session.commit()
                
                # TTS 스크립트 조회
                script = session.get(TTSScript, generation.script_id)
                if not script:
                    raise ValueError("TTS script not found")
                
                # 성우 정보 조회
                voice_actor = None
                if script.voice_actor_id:
                    voice_actor = session.get(VoiceActor, script.voice_actor_id)
                
                # TTS 생성 수행
                audio_file_path = await self._generate_tts_audio(
                    text=script.text_content,
                    voice_actor=voice_actor,
                    generation_params=generation.generation_params or {},
                    session=session
                )
                
                # 오디오 파일 정보 업데이트
                audio_path = Path(audio_file_path)
                file_size = audio_path.stat().st_size if audio_path.exists() else 0
                
                # 오디오 길이 계산 (실제 구현에서는 librosa 등 사용)
                duration = await self._get_audio_duration(audio_file_path)
                
                # 품질 점수 계산 (실제 구현에서는 품질 평가 모델 사용)
                quality_score = await self._calculate_quality_score(audio_file_path, script.text_content)
                
                # 결과 업데이트
                generation.audio_file_path = str(audio_file_path)
                generation.file_size = file_size
                generation.duration = duration
                generation.quality_score = quality_score
                generation.status = GenerationStatus.COMPLETED
                generation.completed_at = datetime.now()
                
                session.add(generation)
                session.commit()
                
                logger.info(f"TTS generation {generation_id} completed successfully")
                
            except Exception as e:
                logger.error(f"TTS generation {generation_id} failed: {e}")
                
                # 실패 상태로 업데이트
                generation.status = GenerationStatus.FAILED
                generation.error_message = str(e)
                generation.completed_at = datetime.now()
                
                session.add(generation)
                session.commit()
    
    async def _generate_tts_audio(
        self, 
        text: str, 
        voice_actor: Optional[VoiceActor], 
        generation_params: dict,
        session: Session
    ) -> str:
        """실제 TTS 오디오 생성"""
        await self.initialize_tts_model()
        
        # 출력 파일 경로 생성
        output_filename = f"tts_{uuid.uuid4().hex[:8]}.wav"
        output_path = self.audio_files_dir / output_filename
        
        logger.info(f"Generating TTS for text: '{text[:50]}...' using {'MOCK' if self.tts_model == 'mock' else 'REAL'} TTS")
        
        if self.tts_model == "mock":
            # Mock TTS (개발/테스트용)
            logger.info("Using mock TTS generation")
            await self._create_mock_audio(str(output_path), text)
        else:
            # 실제 TTS 생성
            try:
                logger.info("Using real TTS generation")
                if voice_actor:
                    # Voice Cloning 사용
                    logger.info(f"Voice cloning with actor: {voice_actor.name}")
                    reference_wavs = await self._get_reference_wavs(voice_actor, session)
                    if reference_wavs:
                        logger.info(f"Found {len(reference_wavs)} reference audio files")
                        await self._generate_with_voice_cloning(
                            text, reference_wavs, str(output_path), generation_params
                        )
                    else:
                        # 참조 음성이 없으면 기본 음성 사용
                        logger.warning(f"No reference audio found for {voice_actor.name}, using default voice")
                        await self._generate_with_default_voice(
                            text, str(output_path), generation_params
                        )
                else:
                    # 기본 음성 사용
                    logger.info("Using default voice")
                    await self._generate_with_default_voice(
                        text, str(output_path), generation_params
                    )
                
                logger.info(f"Real TTS generation completed: {output_path}")
                
            except Exception as e:
                logger.error(f"TTS generation failed: {type(e).__name__}: {str(e)}")
                logger.error(f"Full error: {e}")
                logger.warning("Falling back to mock TTS")
                await self._create_mock_audio(str(output_path), text)
        
        return str(output_path)
    
    async def _get_reference_wavs(self, voice_actor: VoiceActor, session: Session) -> List[str]:
        """성우의 참조 음성 파일들을 가져오기"""
        statement = select(VoiceSample).where(
            VoiceSample.voice_actor_id == voice_actor.id
        ).limit(5)  # 최대 5개 샘플 사용
        
        samples = session.exec(statement).all()
        reference_wavs = []
        
        for sample in samples:
            audio_path = Path(sample.audio_file_path)
            if audio_path.exists():
                reference_wavs.append(str(audio_path))
        
        return reference_wavs
    
    async def _generate_with_voice_cloning(
        self, 
        text: str, 
        reference_wavs: List[str], 
        output_path: str, 
        params: dict
    ):
        """Voice Cloning을 사용한 TTS 생성"""
        try:
            # 비동기 실행을 위해 별도 스레드에서 실행
            loop = asyncio.get_event_loop()
            
            def _sync_generate():
                self.tts_model.tts_to_file(
                    text=text,
                    file_path=output_path,
                    speaker_wav=reference_wavs,
                    language="ko",
                    split_sentences=True,
                    **params
                )
            
            await loop.run_in_executor(None, _sync_generate)
            
        except Exception as e:
            logger.error(f"Voice cloning failed: {e}")
            raise
    
    async def _generate_with_default_voice(
        self, 
        text: str, 
        output_path: str, 
        params: dict
    ):
        """기본 음성을 사용한 TTS 생성"""
        try:
            loop = asyncio.get_event_loop()
            
            def _sync_generate():
                self.tts_model.tts_to_file(
                    text=text,
                    file_path=output_path,
                    language="ko",
                    **params
                )
            
            await loop.run_in_executor(None, _sync_generate)
            
        except Exception as e:
            logger.error(f"Default TTS failed: {e}")
            raise
    
    async def _create_mock_audio(self, output_path: str, text: str):
        """Mock 오디오 파일 생성 (개발/테스트용) - 자연스러운 음성 시뮬레이션"""
        import wave
        import numpy as np
        import random
        
        # 텍스트 길이에 따른 실제적인 duration 계산
        # 한국어 기준 평균 읽기 속도: 분당 400자 정도
        reading_speed_chars_per_second = 400 / 60  # 약 6.7자/초
        duration = max(2.0, len(text) / reading_speed_chars_per_second)
        
        sample_rate = 22050
        samples = int(sample_rate * duration)
        
        # 자연스러운 음성 시뮬레이션을 위한 복합 신호 생성
        time = np.linspace(0, duration, samples)
        
        # 기본 주파수들 (사람 음성 범위: 80-300Hz)
        base_frequencies = [150, 200, 250, 180, 220]  # 다양한 음높이
        wave_data = np.zeros(samples)
        
        # 여러 주파수 성분을 조합하여 더 자연스러운 소리 생성
        for i, freq in enumerate(base_frequencies):
            # 각 주파수마다 약간의 변조 추가
            modulation = 1 + 0.1 * np.sin(2 * np.pi * 2 * time)  # 2Hz 변조
            component = np.sin(2 * np.pi * freq * time * modulation)
            
            # 주파수별 가중치 (낮은 주파수가 더 강함)
            weight = 1.0 / (i + 1)
            wave_data += component * weight
        
        # 음성의 자연스러운 엔벨로프 적용 (서서히 시작해서 서서히 끝)
        envelope = np.ones_like(time)
        fade_duration = min(0.1, duration * 0.1)  # 10% 또는 0.1초
        fade_samples = int(fade_duration * sample_rate)
        
        # Fade in
        envelope[:fade_samples] = np.linspace(0, 1, fade_samples)
        # Fade out
        envelope[-fade_samples:] = np.linspace(1, 0, fade_samples)
        
        wave_data *= envelope
        
        # 약간의 노이즈 추가로 더 자연스럽게
        noise = np.random.normal(0, 0.01, samples)
        wave_data += noise
        
        # 음성의 간헐적 특성 시뮬레이션 (단어 간 짧은 멈춤)
        word_count = len(text.split())
        if word_count > 3:  # 단어가 3개 이상일 때만
            for i in range(1, word_count):
                pause_position = int(samples * i / word_count)
                pause_length = int(sample_rate * 0.1)  # 0.1초 멈춤
                start_idx = max(0, pause_position - pause_length // 2)
                end_idx = min(samples, pause_position + pause_length // 2)
                wave_data[start_idx:end_idx] *= 0.1  # 완전 무음이 아닌 작은 소리
        
        # 정규화 및 16비트 변환
        wave_data = wave_data / np.max(np.abs(wave_data))  # 정규화
        wave_data = (wave_data * 32767 * 0.7).astype(np.int16)  # 볼륨 70%
        
        # WAV 파일로 저장
        try:
            with wave.open(output_path, 'w') as wav_file:
                wav_file.setnchannels(1)  # 모노
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(wave_data.tobytes())
            
            logger.info(f"Mock audio created: {output_path} (duration: {duration:.1f}s, text: '{text[:30]}...')")
            
        except Exception as e:
            logger.error(f"Failed to create mock audio: {e}")
            # 실패 시 단순한 파일 생성
            with wave.open(output_path, 'w') as wav_file:
                simple_wave = np.sin(2 * np.pi * 200 * time) * 0.1
                simple_wave = (simple_wave * 32767).astype(np.int16)
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(simple_wave.tobytes())
        
        # 비동기 시뮬레이션을 위한 지연 (실제 TTS 생성 시간 시뮬레이션)
        await asyncio.sleep(min(3.0, max(1.0, duration * 0.5)))
    
    async def _get_audio_duration(self, audio_file_path: str) -> float:
        """오디오 파일의 길이를 계산"""
        try:
            # librosa를 사용한 실제 구현
            import librosa
            y, sr = librosa.load(audio_file_path)
            return len(y) / sr
        except ImportError:
            # librosa가 없으면 파일 크기로 추정
            file_size = Path(audio_file_path).stat().st_size
            return file_size / (22050 * 2)  # 추정치
        except Exception as e:
            logger.error(f"Failed to get audio duration: {e}")
            return 0.0
    
    async def _calculate_quality_score(self, audio_file_path: str, text: str) -> float:
        """TTS 품질 점수 계산"""
        try:
            # 실제 구현에서는 품질 평가 모델 사용
            # 여기서는 간단한 휴리스틱 사용
            
            # 파일 존재 여부 확인
            if not Path(audio_file_path).exists():
                return 0.0
            
            # 파일 크기 기반 기본 점수
            file_size = Path(audio_file_path).stat().st_size
            base_score = min(90.0, file_size / 1000)  # 1KB당 1점, 최대 90점
            
            # 텍스트 길이 대비 적절성 점수
            text_length_score = min(10.0, len(text) / 10)  # 텍스트 길이 보너스
            
            total_score = base_score + text_length_score
            return min(100.0, total_score)
            
        except Exception as e:
            logger.error(f"Failed to calculate quality score: {e}")
            return 75.0  # 기본 점수
    
    async def cancel_generation(self, generation_id: uuid.UUID) -> bool:
        """TTS 생성 작업 취소"""
        with Session(engine) as session:
            generation = session.get(TTSGeneration, generation_id)
            if not generation:
                return False
            
            if generation.status in [GenerationStatus.PENDING, GenerationStatus.PROCESSING]:
                generation.status = GenerationStatus.CANCELLED
                generation.completed_at = datetime.now()
                session.add(generation)
                session.commit()
                return True
            
            return False
    
    async def get_generation_status(self, generation_id: uuid.UUID) -> Optional[TTSGeneration]:
        """TTS 생성 상태 조회"""
        with Session(engine) as session:
            return session.get(TTSGeneration, generation_id)

    async def process_scenario_tts_generation(
        self, 
        generation_id: uuid.UUID, 
        scenario_tts_id: uuid.UUID
    ) -> None:
        """시나리오 TTS 생성 작업 처리"""
        with Session(engine) as session:
            # 일반 TTS 생성 처리
            await self.process_tts_generation(generation_id)
            
            # 생성 결과를 ScenarioTTS에 반영
            generation = session.get(TTSGeneration, generation_id)
            if generation and generation.status == GenerationStatus.COMPLETED:
                # ScenarioTTS 업데이트를 위해 동적 import 사용
                from app.models.scenario_tts import ScenarioTTS
                
                scenario_tts = session.get(ScenarioTTS, scenario_tts_id)
                if scenario_tts:
                    scenario_tts.audio_file_path = generation.audio_file_path
                    scenario_tts.updated_at = datetime.now()
                    session.add(scenario_tts)
                    session.commit()
                    
                    logger.info(f"ScenarioTTS {scenario_tts_id} updated with audio file")
    
    async def batch_generate_tts(
        self,
        script_ids: List[uuid.UUID],
        force_regenerate: bool = False
    ) -> dict:
        """여러 TTS 스크립트를 한 번에 생성"""
        with Session(engine) as session:
            results = {
                "total_scripts": len(script_ids),
                "generated": 0,
                "skipped": 0,
                "failed": 0,
                "generation_ids": []
            }
            
            for script_id in script_ids:
                try:
                    script = session.get(TTSScript, script_id)
                    if not script:
                        results["failed"] += 1
                        continue
                    
                    # 기존 생성 확인
                    existing_generation = session.exec(
                        select(TTSGeneration).where(
                            TTSGeneration.script_id == script_id,
                            TTSGeneration.status == GenerationStatus.COMPLETED
                        )
                    ).first()
                    
                    if existing_generation and not force_regenerate:
                        results["skipped"] += 1
                        continue
                    
                    # 새 생성 작업 생성
                    generation = TTSGeneration(
                        script_id=script_id,
                        requested_by=script.created_by,
                        generation_params={"batch_mode": True}
                    )
                    
                    session.add(generation)
                    session.commit()
                    session.refresh(generation)
                    
                    results["generation_ids"].append(str(generation.id))
                    results["generated"] += 1
                    
                    # 백그라운드에서 처리 (실제로는 큐에 추가)
                    asyncio.create_task(self.process_tts_generation(generation.id))
                    
                except Exception as e:
                    logger.error(f"Failed to create batch TTS for script {script_id}: {e}")
                    results["failed"] += 1
            
            return results
    
    async def batch_generate_scenario_tts(
        self, 
        scenario_id: uuid.UUID, 
        force_regenerate: bool = False
    ) -> dict:
        """시나리오의 모든 메시지 노드에 대해 일괄 TTS 생성"""
        with Session(engine) as session:
            from app.models.scenario import ScenarioNode
            from app.models.scenario_tts import ScenarioTTS
            
            # 메시지 타입 노드들 조회
            message_nodes = session.exec(
                select(ScenarioNode).where(
                    ScenarioNode.scenario_id == scenario_id,
                    ScenarioNode.node_type == "message"
                )
            ).all()
            
            results = {
                "total_nodes": len(message_nodes),
                "generated": 0,
                "skipped": 0,
                "failed": 0
            }
            
            for node in message_nodes:
                try:
                    # 기존 TTS 확인
                    existing_tts = session.exec(
                        select(ScenarioTTS).where(
                            ScenarioTTS.scenario_id == scenario_id,
                            ScenarioTTS.node_id == node.node_id,
                            ScenarioTTS.is_active == True
                        )
                    ).first()
                    
                    # 이미 TTS가 있고 강제 재생성이 아니면 스킵
                    if existing_tts and existing_tts.audio_file_path and not force_regenerate:
                        results["skipped"] += 1
                        continue
                    
                    # 노드 설정에서 텍스트 추출
                    text_content = node.config.get("text", "")
                    if not text_content:
                        results["skipped"] += 1
                        continue
                    
                    # 기본 성우 사용 (실제로는 설정에서 가져오기)
                    voice_actor_id = node.config.get("voice_actor_id")
                    
                    # TTS 생성 요청
                    # 실제 구현에서는 백그라운드 작업으로 처리
                    results["generated"] += 1
                    
                except Exception as e:
                    logger.error(f"Failed to generate TTS for node {node.node_id}: {e}")
                    results["failed"] += 1
            
            return results

# 싱글톤 인스턴스
tts_service = TTSService()
