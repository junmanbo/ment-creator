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
        self.model_loaded = False
        self.use_gpu = False
        
    async def initialize_tts_model(self):
        """TTS 모델 초기화 (지연 로딩)"""
        if self.model_loaded:
            return
            
        logger.info("TTS 모델 초기화 시작...")
        
        try:
            # 1. PyTorch 확인
            logger.info("PyTorch 가용성 확인 중...")
            import torch
            self.use_gpu = torch.cuda.is_available()
            logger.info(f"PyTorch: {torch.__version__}, GPU: {self.use_gpu}")
            
            if self.use_gpu:
                logger.info(f"사용 가능한 GPU: {torch.cuda.device_count()}개")
                for i in range(torch.cuda.device_count()):
                    gpu_name = torch.cuda.get_device_name(i)
                    memory = torch.cuda.get_device_properties(i).total_memory / 1024**3
                    logger.info(f"  GPU {i}: {gpu_name} ({memory:.1f}GB)")
            else:
                logger.info("GPU를 사용할 수 없습니다. CPU 모드로 진행합니다.")
            
            # 2. TTS 라이브러리 import
            logger.info("Coqui TTS 라이브러리 로딩 중...")
            from TTS.api import TTS
            logger.info("TTS 라이브러리 로드 성공")
            
            # 3. TTS 모델 로딩
            model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
            logger.info(f"TTS 모델 로딩 중: {model_name}")
            logger.info("⚠️  최초 로딩 시 모델 다운로드로 시간이 걸릴 수 있습니다...")
            
            # 비동기 모델 로딩
            loop = asyncio.get_event_loop()
            
            def _load_model():
                try:
                    # 메모리 사용량 최적화 설정
                    tts = TTS(model_name, gpu=self.use_gpu)
                    logger.info("TTS 모델 로딩 성공")
                    return tts
                except Exception as e:
                    logger.error(f"TTS 모델 로딩 실패: {e}")
                    raise
            
            # 실제 모델 로딩 (타임아웃 설정)
            try:
                self.tts_model = await asyncio.wait_for(
                    loop.run_in_executor(None, _load_model),
                    timeout=300  # 5분 타임아웃
                )
                
                # 모델 정보 확인
                try:
                    if hasattr(self.tts_model, 'synthesizer'):
                        synthesizer = self.tts_model.synthesizer
                        if hasattr(synthesizer, 'tts_model'):
                            model_info = {
                                "model_name": model_name,
                                "device": str(getattr(synthesizer.tts_model, 'device', 'unknown')),
                                "is_multi_speaker": getattr(synthesizer.tts_model, 'num_speakers', 0) > 1,
                                "supports_voice_cloning": True
                            }
                            logger.info(f"모델 정보: {model_info}")
                except Exception as e:
                    logger.warning(f"모델 정보 조회 실패: {e}")
                
                logger.info("✅ 실제 TTS 모델 초기화 완료")
                self.model_loaded = True
                
            except asyncio.TimeoutError:
                logger.error("TTS 모델 로딩 타임아웃 (5분)")
                raise Exception("모델 로딩 시간이 초과되었습니다. 네트워크 연결을 확인하거나 나중에 다시 시도해주세요.")
            except Exception as e:
                logger.error(f"TTS 모델 로딩 중 오류 발생: {e}")
                raise Exception(f"TTS 모델 로딩 실패: {str(e)}")
                
        except ImportError as e:
            error_msg = f"TTS 라이브러리가 설치되지 않았습니다: {e}"
            logger.error(error_msg)
            raise Exception(f"{error_msg}\n\n설치 방법:\npip install TTS torch torchaudio")
            
        except Exception as e:
            logger.error(f"TTS 초기화 실패: {e}")
            raise Exception(f"TTS 시스템 초기화에 실패했습니다: {str(e)}")
    
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
                
                logger.info(f"TTS 생성 시작 - ID: {generation_id}")
                logger.info(f"텍스트: '{script.text_content[:50]}...'")
                logger.info(f"성우: {voice_actor.name if voice_actor else '기본 음성'}")
                
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
                
                # 오디오 길이 계산
                duration = await self._get_audio_duration(audio_file_path)
                
                # 품질 점수 계산
                quality_score = await self._calculate_quality_score(
                    audio_file_path, script.text_content, voice_actor is not None
                )
                
                # 결과 업데이트
                generation.audio_file_path = str(audio_file_path)
                generation.file_size = file_size
                generation.duration = duration
                generation.quality_score = quality_score
                generation.status = GenerationStatus.COMPLETED
                generation.completed_at = datetime.now()
                
                session.add(generation)
                session.commit()
                
                logger.info(f"✅ TTS 생성 완료 - ID: {generation_id}")
                logger.info(f"   파일: {audio_file_path}")
                logger.info(f"   크기: {file_size:,} bytes")
                logger.info(f"   길이: {duration:.2f}초")
                logger.info(f"   품질: {quality_score:.1f}점")
                
            except Exception as e:
                logger.error(f"❌ TTS 생성 실패 - ID: {generation_id}: {e}")
                
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
        
        logger.info(f"TTS 생성 시작: '{text[:50]}...'")
        
        try:
            # 실제 TTS 생성
            logger.info("실제 TTS로 음성 생성")
            
            if voice_actor and session:
                # Voice Cloning 사용
                logger.info(f"Voice Cloning 모드: {voice_actor.name}")
                reference_wavs = await self._get_reference_wavs(voice_actor, session)
                
                if reference_wavs:
                    logger.info(f"참조 음성 파일: {len(reference_wavs)}개")
                    await self._generate_with_voice_cloning(
                        text, reference_wavs, str(output_path), generation_params
                    )
                else:
                    logger.warning(f"{voice_actor.name}의 참조 음성이 없습니다. 기본 음성 사용")
                    await self._generate_with_default_voice(
                        text, str(output_path), generation_params
                    )
            else:
                # 기본 음성 사용
                logger.info("기본 음성으로 생성")
                await self._generate_with_default_voice(
                    text, str(output_path), generation_params
                )
            
            logger.info(f"실제 TTS 생성 완료: {output_path}")
            
        except Exception as e:
            logger.error(f"실제 TTS 생성 실패: {type(e).__name__}: {str(e)}")
            # Mock으로 fallback하지 않고 에러를 그대로 전달
            raise Exception(f"TTS 음성 생성에 실패했습니다: {str(e)}")
        
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
                # 파일 유효성 검사
                try:
                    file_size = audio_path.stat().st_size
                    if file_size > 1000:  # 최소 1KB 이상
                        reference_wavs.append(str(audio_path))
                        logger.info(f"참조 음성 추가: {audio_path.name} ({file_size:,} bytes)")
                    else:
                        logger.warning(f"참조 음성 크기가 너무 작음: {audio_path.name}")
                except Exception as e:
                    logger.warning(f"참조 음성 파일 확인 실패: {audio_path.name} - {e}")
        
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
            logger.info(f"Voice Cloning 시작: {len(reference_wavs)}개 참조 음성 사용")
            
            # 비동기 실행을 위해 별도 스레드에서 실행
            loop = asyncio.get_event_loop()
            
            def _sync_generate():
                # XTTS v2 매개변수 최적화
                tts_params = {
                    "text": text,
                    "file_path": output_path,
                    "speaker_wav": reference_wavs,
                    "language": "ko",
                    "split_sentences": True,
                    "temperature": params.get("temperature", 0.7),
                    "length_penalty": params.get("length_penalty", 1.0),
                    "repetition_penalty": params.get("repetition_penalty", 5.0),
                    "top_k": params.get("top_k", 50),
                    "top_p": params.get("top_p", 0.85),
                }
                
                logger.info(f"TTS 매개변수: {tts_params}")
                self.tts_model.tts_to_file(**tts_params)
            
            # 타임아웃을 둬서 무한 대기 방지
            await asyncio.wait_for(
                loop.run_in_executor(None, _sync_generate),
                timeout=120  # 2분 타임아웃
            )
            
            logger.info("Voice Cloning 완료")
            
        except asyncio.TimeoutError:
            logger.error("Voice Cloning 타임아웃")
            raise Exception("음성 생성 시간이 초과되었습니다 (2분)")
        except Exception as e:
            logger.error(f"Voice Cloning 실패: {e}")
            raise Exception(f"Voice Cloning 실패: {str(e)}")
    
    async def _generate_with_default_voice(
        self, 
        text: str, 
        output_path: str, 
        params: dict
    ):
        """기본 음성을 사용한 TTS 생성"""
        try:
            logger.info("기본 음성으로 TTS 생성")
            
            loop = asyncio.get_event_loop()
            
            def _sync_generate():
                tts_params = {
                    "text": text,
                    "file_path": output_path,
                    "language": "ko",
                    "split_sentences": True,
                    **{k: v for k, v in params.items() if k in ['temperature', 'length_penalty', 'repetition_penalty']}
                }
                
                logger.info(f"기본 TTS 매개변수: {tts_params}")
                self.tts_model.tts_to_file(**tts_params)
            
            await asyncio.wait_for(
                loop.run_in_executor(None, _sync_generate),
                timeout=60  # 1분 타임아웃
            )
            
            logger.info("기본 음성 TTS 완료")
            
        except asyncio.TimeoutError:
            logger.error("기본 TTS 타임아웃")
            raise Exception("음성 생성 시간이 초과되었습니다 (1분)")
        except Exception as e:
            logger.error(f"기본 TTS 실패: {e}")
            raise Exception(f"기본 TTS 실패: {str(e)}")
    
    async def _get_audio_duration(self, audio_file_path: str) -> float:
        """오디오 파일의 정확한 길이를 계산"""
        try:
            # librosa를 사용한 정확한 duration 계산
            try:
                import librosa
                y, sr = librosa.load(audio_file_path)
                duration = len(y) / sr
                logger.debug(f"librosa로 계산된 길이: {duration:.2f}초")
                return duration
            except ImportError:
                logger.debug("librosa가 없어 wave 모듈 사용")
            
            # wave 모듈을 사용한 duration 계산
            import wave
            with wave.open(audio_file_path, 'rb') as wav_file:
                frames = wav_file.getnframes()
                sample_rate = wav_file.getframerate()
                duration = frames / sample_rate
                logger.debug(f"wave 모듈로 계산된 길이: {duration:.2f}초")
                return duration
                
        except Exception as e:
            logger.warning(f"오디오 길이 계산 실패: {e}")
            # 파일 크기 기반 추정
            try:
                file_size = Path(audio_file_path).stat().st_size
                estimated_duration = file_size / (22050 * 2)  # 추정치
                logger.debug(f"파일 크기 기반 추정 길이: {estimated_duration:.2f}초")
                return estimated_duration
            except:
                return 3.0  # 기본값
    
    async def _calculate_quality_score(
        self, 
        audio_file_path: str, 
        text: str, 
        is_voice_cloning: bool = False
    ) -> float:
        """TTS 품질 점수 계산"""
        try:
            if not Path(audio_file_path).exists():
                return 0.0
            
            file_size = Path(audio_file_path).stat().st_size
            duration = await self._get_audio_duration(audio_file_path)
            
            # 기본 점수 계산
            base_score = 85.0  # 실제 TTS는 85점부터 시작
            
            # 파일 크기 점수 (너무 작거나 큰 파일은 품질이 낮을 가능성)
            size_score = 0
            if 10000 < file_size < 5000000:  # 10KB ~ 5MB
                size_score = 10
            elif file_size >= 5000:
                size_score = 5
            
            # Duration 적절성 점수
            expected_duration = len(text) / 6  # 초당 6자 읽기 기준
            duration_ratio = duration / max(expected_duration, 1)
            
            if 0.5 <= duration_ratio <= 2.0:  # 적절한 범위
                duration_score = 10
            elif 0.3 <= duration_ratio <= 3.0:
                duration_score = 5
            else:
                duration_score = 0
            
            # Voice Cloning 보너스
            voice_cloning_bonus = 5 if is_voice_cloning else 0
            
            # 텍스트 복잡도 점수
            complexity_score = min(5, len(text) / 20)
            
            total_score = base_score + size_score + duration_score + voice_cloning_bonus + complexity_score
            
            return min(100.0, max(0.0, total_score))
            
        except Exception as e:
            logger.error(f"품질 점수 계산 실패: {e}")
            return 85.0  # 실제 TTS 기본 점수
    
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
                logger.info(f"TTS 생성 취소됨: {generation_id}")
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
                    
                    # 백그라운드에서 처리
                    asyncio.create_task(self.process_tts_generation(generation.id))
                    
                except Exception as e:
                    logger.error(f"Failed to create batch TTS for script {script_id}: {e}")
                    results["failed"] += 1
            
            return results
    
    async def test_tts_functionality(self) -> dict:
        """TTS 기능 테스트"""
        logger.info("TTS 기능 테스트 시작")
        
        try:
            await self.initialize_tts_model()
            
            test_text = "안녕하세요. 이것은 TTS 기능 테스트입니다."
            test_file = self.audio_files_dir / "test_functionality.wav"
            
            # 실제 TTS 테스트
            await self._generate_with_default_voice(test_text, str(test_file), {})
            
            # 결과 분석
            if test_file.exists():
                file_size = test_file.stat().st_size
                duration = await self._get_audio_duration(str(test_file))
                
                result = {
                    "success": True,
                    "mode": "Real TTS",
                    "file_size": file_size,
                    "duration": duration,
                    "file_path": str(test_file)
                }
                
                logger.info(f"✅ TTS 테스트 성공: Real TTS")
                return result
            else:
                return {"success": False, "error": "파일 생성 실패"}
                
        except Exception as e:
            logger.error(f"TTS 테스트 실패: {e}")
            return {"success": False, "error": str(e)}

# 싱글톤 인스턴스
tts_service = TTSService()
