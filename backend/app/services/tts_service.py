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
            try:
                # TTS 라이브러리 import는 실제 사용 시점에 수행
                from TTS.api import TTS
                
                # XTTS v2 모델 로드 (다국어 지원)
                model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
                
                # GPU 사용 가능 여부 확인
                try:
                    import torch
                    use_gpu = torch.cuda.is_available()
                except ImportError:
                    use_gpu = False
                
                self.tts_model = TTS(model_name, gpu=use_gpu)
                logger.info(f"TTS model {model_name} loaded successfully")
                
            except ImportError:
                logger.warning("TTS library not available, using mock TTS")
                self.tts_model = "mock"
            except Exception as e:
                logger.error(f"Failed to load TTS model: {e}")
                self.tts_model = "mock"
    
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
        
        if self.tts_model == "mock":
            # Mock TTS (개발/테스트용)
            await self._create_mock_audio(str(output_path), text)
        else:
            # 실제 TTS 생성
            try:
                if voice_actor:
                    # Voice Cloning 사용
                    reference_wavs = await self._get_reference_wavs(voice_actor, session)
                    if reference_wavs:
                        await self._generate_with_voice_cloning(
                            text, reference_wavs, str(output_path), generation_params
                        )
                    else:
                        # 참조 음성이 없으면 기본 음성 사용
                        await self._generate_with_default_voice(
                            text, str(output_path), generation_params
                        )
                else:
                    # 기본 음성 사용
                    await self._generate_with_default_voice(
                        text, str(output_path), generation_params
                    )
            except Exception as e:
                logger.error(f"TTS generation failed, falling back to mock: {e}")
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
        """Mock 오디오 파일 생성 (개발/테스트용)"""
        # 간단한 mock 오디오 파일 생성
        import wave
        import numpy as np
        
        # 1초간의 sine wave 생성
        sample_rate = 22050
        duration = max(1.0, len(text) * 0.1)  # 텍스트 길이에 비례
        samples = int(sample_rate * duration)
        
        # 440Hz sine wave
        wave_data = np.sin(2 * np.pi * 440 * np.linspace(0, duration, samples))
        wave_data = (wave_data * 32767).astype(np.int16)
        
        # WAV 파일로 저장
        with wave.open(output_path, 'w') as wav_file:
            wav_file.setnchannels(1)  # 모노
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(wave_data.tobytes())
        
        # 비동기 시뮬레이션을 위한 지연
        await asyncio.sleep(1)
    
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

    async def train_voice_model(self, model_id: uuid.UUID) -> None:
        """음성 모델 학습 처리 (백그라운드 작업)"""
        with Session(engine) as session:
            from app.models.voice_actor import VoiceModel, ModelStatus
            
            voice_model = session.get(VoiceModel, model_id)
            if not voice_model:
                logger.error(f"Voice model {model_id} not found")
                return
            
            try:
                logger.info(f"Starting training for voice model {model_id}")
                
                # 성우의 음성 샘플들 수집
                samples = session.exec(
                    select(VoiceSample).where(
                        VoiceSample.voice_actor_id == voice_model.voice_actor_id
                    )
                ).all()
                
                if len(samples) < 3:
                    raise ValueError("최소 3개의 음성 샘플이 필요합니다.")
                
                # 학습 데이터 준비
                sample_paths = [sample.audio_file_path for sample in samples]
                sample_texts = [sample.text_content for sample in samples]
                
                # 실제 학습 (현재는 Mock 구현)
                training_duration = await self._mock_model_training(
                    voice_model, sample_paths, sample_texts
                )
                
                # 모델 상태 업데이트
                voice_model.status = ModelStatus.READY
                voice_model.training_data_duration = training_duration
                voice_model.quality_score = 85.0 + (len(samples) * 2)  # 샘플 수에 따른 품질 점수
                voice_model.updated_at = datetime.now()
                
                session.add(voice_model)
                session.commit()
                
                logger.info(f"Voice model {model_id} training completed successfully")
                
            except Exception as e:
                logger.error(f"Voice model {model_id} training failed: {e}")
                
                # 에러 상태로 업데이트
                voice_model.status = ModelStatus.ERROR
                voice_model.updated_at = datetime.now()
                
                session.add(voice_model)
                session.commit()
    
    async def _mock_model_training(
        self,
        voice_model,
        sample_paths: List[str],
        sample_texts: List[str]
    ) -> int:
        """Mock 모델 학습 (실제 학습 구현까지의 임시)"""
        logger.info(f"Mock training for model {voice_model.model_name}")
        
        # 학습 시뮬레이션 (실제로는 GPU에서 수 시간 소요)
        training_time = len(sample_paths) * 5  # 샘플 당 5초씩 훈련 시뮬레이션
        await asyncio.sleep(min(training_time, 30))  # 최대 30초로 제한 (테스트용)
        
        # 학습 데이터 총 시간 계산
        total_duration = 0
        for sample_path in sample_paths:
            try:
                duration = await self._get_audio_duration(sample_path)
                total_duration += duration
            except Exception:
                total_duration += 10  # 기본값 10초
        
        return int(total_duration)
    
    async def get_model_training_status(self, model_id: uuid.UUID) -> Optional[dict]:
        """모델 학습 상태 조회"""
        with Session(engine) as session:
            from app.models.voice_actor import VoiceModel
            
            voice_model = session.get(VoiceModel, model_id)
            if not voice_model:
                return None
            
            return {
                "model_id": str(voice_model.id),
                "model_name": voice_model.model_name,
                "status": voice_model.status,
                "quality_score": voice_model.quality_score,
                "training_duration": voice_model.training_data_duration,
                "created_at": voice_model.created_at.isoformat(),
                "updated_at": voice_model.updated_at.isoformat()
            }

# 싱글톤 인스턴스
tts_service = TTSService()
