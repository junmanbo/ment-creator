"""
Fish Speech Mock TTS 서비스
실제 Fish Speech 없이도 테스트할 수 있는 Mock 버전
"""

import os
import uuid
import asyncio
import logging
import time
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.core.db import engine
from app.models.tts import TTSGeneration, TTSScript, GenerationStatus
from app.models.voice_actor import VoiceActor, VoiceSample
from app.core.config import settings

logger = logging.getLogger(__name__)

class FishSpeechMockTTSService:
    """Fish Speech Mock TTS 서비스 - 테스트용"""
    
    def __init__(self):
        self.api_url = "http://127.0.0.1:8765"  # Mock API URL
        self.audio_files_dir = Path("audio_files")
        self.voice_samples_dir = Path("voice_samples")
        
        # 디렉토리 생성
        self.audio_files_dir.mkdir(exist_ok=True)
        self.voice_samples_dir.mkdir(exist_ok=True)
        
        self.model_loaded = True  # Mock에서는 항상 로드됨
        self.initialization_lock = asyncio.Lock()
        
        # Mock 설정
        self.config = {
            "language": "ko",
            "temperature": 0.7,
            "top_p": 0.85,
            "top_k": 50,
            "repetition_penalty": 1.1,
            "sample_rate": 22050,
            "format": "wav"
        }
        
        logger.info("🐟 Fish Speech Mock TTS 서비스 초기화")
    
    async def initialize_tts_model(self):
        """Mock 모델 초기화 - 즉시 완료"""
        async with self.initialization_lock:
            if self.model_loaded:
                return
                
            logger.info("🐟 Fish Speech Mock 모델 초기화...")
            
            # Mock 초기화 - 빠르게 완료
            await asyncio.sleep(0.1)
            
            self.model_loaded = True
            logger.info("✅ Fish Speech Mock 모델 초기화 완료")
    
    async def _check_fish_speech_installation(self) -> bool:
        """Mock 설치 확인 - 항상 True"""
        logger.info("Fish Speech Mock 설치 상태 확인...")
        await asyncio.sleep(0.1)
        logger.info("✅ Fish Speech Mock 설치 확인")
        return True
    
    async def process_tts_generation(self, generation_id: uuid.UUID) -> None:
        """Mock TTS 생성 작업 처리"""
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
                
                logger.info(f"🐟 Fish Speech Mock TTS 생성 시작 - ID: {generation_id}")
                logger.info(f"텍스트: '{script.text_content[:50]}...'")
                logger.info(f"성우: {voice_actor.name if voice_actor else '기본 음성'}")
                
                # Mock TTS 생성 (빠른 시뮬레이션)
                audio_file_path = await self._generate_mock_tts(
                    text=script.text_content,
                    voice_actor=voice_actor,
                    generation_params=generation.generation_params or {}
                )
                
                # 결과 파일 정보 업데이트
                audio_path = Path(audio_file_path)
                file_size = audio_path.stat().st_size if audio_path.exists() else 0
                duration = await self._calculate_mock_duration(script.text_content)
                quality_score = await self._calculate_mock_quality_score(
                    script.text_content, voice_actor is not None
                )
                
                # 성공 상태로 업데이트
                generation.audio_file_path = str(audio_file_path)
                generation.file_size = file_size
                generation.duration = duration
                generation.quality_score = quality_score
                generation.status = GenerationStatus.COMPLETED
                generation.completed_at = datetime.now()
                
                session.add(generation)
                session.commit()
                
                logger.info(f"✅ Fish Speech Mock TTS 생성 완료 - ID: {generation_id}")
                logger.info(f"   파일: {audio_file_path}")
                logger.info(f"   크기: {file_size:,} bytes")
                logger.info(f"   길이: {duration:.2f}초")
                logger.info(f"   품질: {quality_score:.1f}점")
                
            except Exception as e:
                logger.error(f"❌ Fish Speech Mock TTS 생성 실패 - ID: {generation_id}: {e}")
                
                # 실패 상태로 업데이트
                generation.status = GenerationStatus.FAILED
                generation.error_message = str(e)
                generation.completed_at = datetime.now()
                
                session.add(generation)
                session.commit()
    
    async def _generate_mock_tts(
        self,
        text: str,
        voice_actor: Optional[VoiceActor],
        generation_params: dict
    ) -> str:
        """Mock TTS 생성 - 실제 음성 파일 대신 빈 WAV 파일 생성"""
        await self.initialize_tts_model()
        
        # 빠른 Mock 생성 시뮬레이션
        await asyncio.sleep(0.5)  # 0.5초 대기로 생성 시뮬레이션
        
        # 출력 파일 경로 생성
        output_filename = f"fish_mock_tts_{uuid.uuid4().hex[:8]}.wav"
        output_path = self.audio_files_dir / output_filename
        
        logger.info(f"🐟 Fish Speech Mock TTS 생성: '{text[:50]}...'")
        
        try:
            # Mock WAV 파일 생성 (빈 파일이지만 실제 WAV 헤더 포함)
            await self._create_mock_wav_file(str(output_path), text)
            
            if not Path(output_path).exists():
                raise Exception("Mock TTS 파일이 생성되지 않았습니다")
            
            logger.info(f"🐟 Fish Speech Mock TTS 생성 완료: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Fish Speech Mock TTS 생성 실패: {e}")
            raise Exception(f"Fish Speech Mock TTS 생성 실패: {str(e)}")
    
    async def _create_mock_wav_file(self, output_path: str, text: str):
        """Mock WAV 파일 생성 (실제 WAV 헤더를 가진 빈 파일)"""
        try:
            # 텍스트 길이에 따른 예상 오디오 길이 계산
            estimated_duration = max(1.0, len(text) / 10.0)  # 초당 10자
            sample_rate = 22050
            samples = int(estimated_duration * sample_rate)
            
            # WAV 헤더 생성 (44 bytes)
            wav_header = bytearray()
            wav_header.extend(b'RIFF')  # ChunkID
            wav_header.extend((36 + samples * 2).to_bytes(4, 'little'))  # ChunkSize
            wav_header.extend(b'WAVE')  # Format
            wav_header.extend(b'fmt ')  # Subchunk1ID
            wav_header.extend((16).to_bytes(4, 'little'))  # Subchunk1Size
            wav_header.extend((1).to_bytes(2, 'little'))   # AudioFormat (PCM)
            wav_header.extend((1).to_bytes(2, 'little'))   # NumChannels (Mono)
            wav_header.extend(sample_rate.to_bytes(4, 'little'))  # SampleRate
            wav_header.extend((sample_rate * 2).to_bytes(4, 'little'))  # ByteRate
            wav_header.extend((2).to_bytes(2, 'little'))   # BlockAlign
            wav_header.extend((16).to_bytes(2, 'little'))  # BitsPerSample
            wav_header.extend(b'data')  # Subchunk2ID
            wav_header.extend((samples * 2).to_bytes(4, 'little'))  # Subchunk2Size
            
            # 무음 데이터 (0으로 채움)
            audio_data = bytearray(samples * 2)  # 16-bit = 2 bytes per sample
            
            # 파일 저장
            with open(output_path, 'wb') as f:
                f.write(wav_header)
                f.write(audio_data)
            
            logger.info(f"Mock WAV 파일 생성 완료: {output_path} ({len(wav_header) + len(audio_data)} bytes)")
            
        except Exception as e:
            logger.error(f"Mock WAV 파일 생성 실패: {e}")
            # 최소한의 빈 파일이라도 생성
            with open(output_path, 'wb') as f:
                f.write(b'MOCK_AUDIO_FILE')
    
    async def _calculate_mock_duration(self, text: str) -> float:
        """Mock 오디오 길이 계산"""
        # 텍스트 길이 기반 추정
        estimated_duration = max(1.0, len(text) / 10.0)  # 초당 10자
        return round(estimated_duration, 2)
    
    async def _calculate_mock_quality_score(
        self,
        text: str,
        is_voice_cloning: bool = False
    ) -> float:
        """Mock 품질 점수 계산"""
        # Fish Speech Mock는 높은 품질 점수
        base_score = 90.0
        
        # 텍스트 길이 보너스
        length_bonus = min(5.0, len(text) / 20)
        
        # Voice Cloning 보너스
        voice_cloning_bonus = 5.0 if is_voice_cloning else 0
        
        total_score = base_score + length_bonus + voice_cloning_bonus
        
        return min(100.0, max(85.0, total_score))
    
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
                logger.info(f"Mock TTS 생성 취소됨: {generation_id}")
                return True
            
            return False
    
    async def get_generation_status(self, generation_id: uuid.UUID) -> Optional[TTSGeneration]:
        """TTS 생성 상태 조회"""
        with Session(engine) as session:
            return session.get(TTSGeneration, generation_id)
    
    async def test_tts_functionality(self) -> dict:
        """Fish Speech Mock TTS 기능 테스트"""
        logger.info("🐟 Fish Speech Mock TTS 기능 테스트 시작")
        
        try:
            await self.initialize_tts_model()
            
            test_text = "안녕하세요. 이것은 Fish Speech Mock TTS 기능 테스트입니다."
            test_file = self.audio_files_dir / "test_fish_speech_mock.wav"
            
            # Mock TTS 테스트
            await self._create_mock_wav_file(str(test_file), test_text)
            
            if test_file.exists():
                file_size = test_file.stat().st_size
                duration = await self._calculate_mock_duration(test_text)
                
                result = {
                    "success": True,
                    "engine": "Fish Speech (Mock)",
                    "file_size": file_size,
                    "duration": duration,
                    "file_path": str(test_file),
                    "quality_estimated": 92.0,
                    "generation_time": 0.5,
                    "mock_mode": True
                }
                
                logger.info("✅ Fish Speech Mock TTS 테스트 성공")
                return result
            else:
                return {"success": False, "error": "Fish Speech Mock 파일 생성 실패"}
                
        except Exception as e:
            logger.error(f"Fish Speech Mock TTS 테스트 실패: {e}")
            return {"success": False, "error": str(e)}
    
    def __del__(self):
        """Mock 서비스 종료"""
        logger.info("Fish Speech Mock TTS 서비스 종료")

# Fish Speech Mock TTS 서비스 인스턴스
fish_speech_mock_tts_service = FishSpeechMockTTSService()
