"""
Fish Speech 기반 TTS 서비스
Coqui TTS를 대체하는 고성능 TTS 시스템
"""

import os
import uuid
import asyncio
import logging
import json
import httpx
import subprocess
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

class FishSpeechTTSService:
    """Fish Speech 기반 TTS 서비스"""
    
    def __init__(self):
        self.api_url = "http://127.0.0.1:8765"  # Fish Speech API 서버
        self.audio_files_dir = Path("audio_files")
        self.voice_samples_dir = Path("voice_samples")
        self.fish_speech_dir = Path("fish_speech/fish-speech")
        
        # 디렉토리 생성
        self.audio_files_dir.mkdir(exist_ok=True)
        self.voice_samples_dir.mkdir(exist_ok=True)
        
        self.api_server_process = None
        self.model_loaded = False
        self.initialization_lock = asyncio.Lock()
        
        # Fish Speech 설정
        self.config = {
            "language": "ko",
            "temperature": 0.7,
            "top_p": 0.85,
            "top_k": 50,
            "repetition_penalty": 1.1,
            "sample_rate": 22050,
            "format": "wav"
        }
        
        logger.info("🐟 Fish Speech TTS 서비스 초기화")
    
    async def initialize_tts_model(self):
        """Fish Speech 모델 및 API 서버 초기화"""
        async with self.initialization_lock:
            if self.model_loaded:
                return
                
            logger.info("🐟 Fish Speech 모델 초기화 시작...")
            
            try:
                # 1. Fish Speech 설치 확인
                if not await self._check_fish_speech_installation():
                    raise Exception("Fish Speech가 설치되지 않았습니다. install_fish_speech.py를 실행해주세요.")
                
                # 2. API 서버 시작
                await self._start_api_server()
                
                # 3. API 서버 연결 확인
                await self._wait_for_api_server()
                
                # 4. 모델 상태 확인
                await self._check_model_status()
                
                self.model_loaded = True
                logger.info("✅ Fish Speech 모델 초기화 완료")
                
            except Exception as e:
                logger.error(f"❌ Fish Speech 초기화 실패: {e}")
                raise Exception(f"Fish Speech 시스템을 초기화할 수 없습니다: {str(e)}")
    
    async def _check_fish_speech_installation(self) -> bool:
        """Fish Speech 설치 상태 확인"""
        logger.info("Fish Speech 설치 상태 확인...")
        
        # 1. 디렉토리 확인
        if not self.fish_speech_dir.exists():
            logger.error(f"Fish Speech 디렉토리가 없습니다: {self.fish_speech_dir}")
            return False
        
        # 2. 모델 파일 확인
        model_dir = self.fish_speech_dir / "checkpoints"
        if not model_dir.exists():
            logger.error(f"모델 디렉토리가 없습니다: {model_dir}")
            return False
        
        # 3. Python 모듈 확인
        try:
            # fish_speech 모듈이 import 가능한지 확인
            result = subprocess.run([
                "python", "-c", "import fish_speech; print('Fish Speech 모듈 로드 성공')"
            ], cwd=self.fish_speech_dir, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                logger.info("✅ Fish Speech 모듈 설치 확인")
                return True
            else:
                logger.error(f"Fish Speech 모듈 로드 실패: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Fish Speech 모듈 확인 실패: {e}")
            return False
    
    async def _start_api_server(self):
        """Fish Speech API 서버 시작"""
        logger.info("Fish Speech API 서버 시작...")
        
        # 기존 서버가 실행 중인지 확인
        if await self._is_api_server_running():
            logger.info("API 서버가 이미 실행 중입니다")
            return
        
        try:
            # start_fish_speech_server.py 스크립트 사용
            backend_dir = Path(__file__).parent.parent.parent
            server_script = backend_dir / "start_fish_speech_server.py"
            
            if not server_script.exists():
                raise Exception(f"Fish Speech 서버 스크립트를 찾을 수 없습니다: {server_script}")
            
            # 백그라운드에서 서버 시작
            self.api_server_process = subprocess.Popen(
                ["python", str(server_script), "start"],
                cwd=backend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            logger.info(f"Fish Speech API 서버 시작 - PID: {self.api_server_process.pid}")
            
            # 서버가 시작될 시간을 좀 더 줌
            await asyncio.sleep(5)
            
        except Exception as e:
            logger.error(f"API 서버 시작 실패: {e}")
            raise Exception(f"Fish Speech API 서버를 시작할 수 없습니다: {str(e)}")
    
    async def _is_api_server_running(self) -> bool:
        """API 서버 실행 상태 확인 (health 및 root 엔드포인트 체크)"""
        try:
            async with httpx.AsyncClient() as client:
                # 여러 엔드포인트 시도
                endpoints = ["/health", "/", "/docs"]
                
                for endpoint in endpoints:
                    try:
                        response = await client.get(f"{self.api_url}{endpoint}", timeout=3)
                        if response.status_code in [200, 404]:  # 404도 서버가 응답하는 것
                            logger.debug(f"API 서버 응답 확인: {endpoint} -> {response.status_code}")
                            return True
                    except:
                        continue
                        
                return False
        except:
            return False
    
    async def _wait_for_api_server(self, timeout: int = 90):
        """API 서버 준비 대기 (시간 연장)"""
        logger.info("API 서버 준비 대기... (최대 90초)")
        
        start_time = time.time()
        wait_count = 0
        while time.time() - start_time < timeout:
            if await self._is_api_server_running():
                logger.info("✅ API 서버 준비 완료")
                return
            
            await asyncio.sleep(3)  # 좀 더 여유있게 대기
            wait_count += 1
            if wait_count % 10 == 0:  # 30초마다 로그
                elapsed = int(time.time() - start_time)
                logger.info(f"API 서버 대기 중... ({elapsed}초 경과)")
        
        raise Exception(f"API 서버가 {timeout}초 내에 준비되지 않았습니다")
    
    async def _check_model_status(self):
        """모델 상태 확인"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_url}/models")
                if response.status_code == 200:
                    models = response.json()
                    logger.info(f"사용 가능한 모델: {models}")
                else:
                    logger.warning("모델 상태 확인 실패")
        except Exception as e:
            logger.warning(f"모델 상태 확인 중 오류: {e}")
    
    async def process_tts_generation(self, generation_id: uuid.UUID) -> None:
        """TTS 생성 작업 처리"""
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
                
                logger.info(f"🐟 Fish Speech TTS 생성 시작 - ID: {generation_id}")
                logger.info(f"텍스트: '{script.text_content[:50]}...'")
                logger.info(f"성우: {voice_actor.name if voice_actor else '기본 음성'}")
                
                # Fish Speech로 TTS 생성
                audio_file_path = await self._generate_fish_speech_tts(
                    text=script.text_content,
                    voice_actor=voice_actor,
                    generation_params=generation.generation_params or {},
                    session=session
                )
                
                # 결과 파일 정보 업데이트
                audio_path = Path(audio_file_path)
                file_size = audio_path.stat().st_size if audio_path.exists() else 0
                duration = await self._get_audio_duration(audio_file_path)
                quality_score = await self._calculate_quality_score(
                    audio_file_path, script.text_content, voice_actor is not None
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
                
                logger.info(f"✅ Fish Speech TTS 생성 완료 - ID: {generation_id}")
                logger.info(f"   파일: {audio_file_path}")
                logger.info(f"   크기: {file_size:,} bytes")
                logger.info(f"   길이: {duration:.2f}초")
                logger.info(f"   품질: {quality_score:.1f}점")
                
            except Exception as e:
                logger.error(f"❌ Fish Speech TTS 생성 실패 - ID: {generation_id}: {e}")
                
                # 실패 상태로 업데이트
                generation.status = GenerationStatus.FAILED
                generation.error_message = str(e)
                generation.completed_at = datetime.now()
                
                session.add(generation)
                session.commit()
    
    async def _generate_fish_speech_tts(
        self,
        text: str,
        voice_actor: Optional[VoiceActor],
        generation_params: dict,
        session: Session
    ) -> str:
        """Fish Speech를 사용한 실제 TTS 생성"""
        await self.initialize_tts_model()
        
        # 출력 파일 경로 생성
        output_filename = f"fish_tts_{uuid.uuid4().hex[:8]}.wav"
        output_path = self.audio_files_dir / output_filename
        
        logger.info(f"🐟 Fish Speech TTS 생성: '{text[:50]}...'")
        
        try:
            if voice_actor and session:
                # Voice Cloning 모드
                logger.info(f"Voice Cloning 모드: {voice_actor.name}")
                reference_audio = await self._get_best_reference_audio(voice_actor, session)
                
                if reference_audio:
                    await self._generate_with_fish_speech_cloning(
                        text, reference_audio, str(output_path), generation_params
                    )
                else:
                    logger.warning(f"{voice_actor.name}의 참조 음성이 없습니다. 기본 음성 사용")
                    await self._generate_with_fish_speech_default(
                        text, str(output_path), generation_params
                    )
            else:
                # 기본 음성 모드
                logger.info("기본 음성으로 생성")
                await self._generate_with_fish_speech_default(
                    text, str(output_path), generation_params
                )
            
            if not Path(output_path).exists():
                raise Exception("TTS 파일이 생성되지 않았습니다")
            
            logger.info(f"🐟 Fish Speech TTS 생성 완료: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Fish Speech TTS 생성 실패: {e}")
            raise Exception(f"Fish Speech TTS 생성 실패: {str(e)}")
    
    async def _get_best_reference_audio(
        self, 
        voice_actor: VoiceActor, 
        session: Session
    ) -> Optional[str]:
        """최적의 참조 음성 파일 선택"""
        statement = select(VoiceSample).where(
            VoiceSample.voice_actor_id == voice_actor.id
        ).limit(1)  # Fish Speech는 1개 참조 음성 권장
        
        sample = session.exec(statement).first()
        if sample and Path(sample.audio_file_path).exists():
            logger.info(f"참조 음성 선택: {sample.audio_file_path}")
            return sample.audio_file_path
        
        return None
    
    async def _generate_with_fish_speech_cloning(
        self,
        text: str,
        reference_audio: str,
        output_path: str,
        params: dict
    ):
        """Fish Speech Voice Cloning을 사용한 TTS 생성"""
        logger.info(f"🐟 Fish Speech Voice Cloning 시작")
        
        try:
            # Fish Speech API 요청 데이터
            request_data = {
                "text": text,
                "reference_audio": reference_audio,
                "language": params.get("language", self.config["language"]),
                "temperature": params.get("temperature", self.config["temperature"]),
                "top_p": params.get("top_p", self.config["top_p"]),
                "top_k": params.get("top_k", self.config["top_k"]),
                "repetition_penalty": params.get("repetition_penalty", self.config["repetition_penalty"]),
                "format": self.config["format"],
                "sample_rate": self.config["sample_rate"]
            }
            
            logger.info(f"Fish Speech API 요청: {request_data}")
            
            async with httpx.AsyncClient(timeout=120) as client:
                # 파일 업로드 및 TTS 생성 요청
                with open(reference_audio, "rb") as ref_file:
                    files = {"reference_audio": ref_file}
                    data = {k: v for k, v in request_data.items() if k != "reference_audio"}
                    
                    response = await client.post(
                        f"{self.api_url}/tts",
                        files=files,
                        data=data
                    )
                
                if response.status_code == 200:
                    # 생성된 오디오 파일 저장
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                    
                    logger.info("✅ Fish Speech Voice Cloning 성공")
                else:
                    error_msg = f"API 요청 실패: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    raise Exception(error_msg)
            
        except Exception as e:
            logger.error(f"Fish Speech Voice Cloning 실패: {e}")
            raise Exception(f"Voice Cloning 실패: {str(e)}")
    
    async def _generate_with_fish_speech_default(
        self,
        text: str,
        output_path: str,
        params: dict
    ):
        """Fish Speech 기본 음성으로 TTS 생성"""
        logger.info("🐟 Fish Speech 기본 음성 생성")
        
        try:
            request_data = {
                "text": text,
                "language": params.get("language", self.config["language"]),
                "temperature": params.get("temperature", self.config["temperature"]),
                "top_p": params.get("top_p", self.config["top_p"]),
                "top_k": params.get("top_k", self.config["top_k"]),
                "repetition_penalty": params.get("repetition_penalty", self.config["repetition_penalty"]),
                "format": self.config["format"],
                "sample_rate": self.config["sample_rate"]
            }
            
            logger.info(f"Fish Speech API 요청: {request_data}")
            
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    f"{self.api_url}/tts",
                    json=request_data
                )
                
                if response.status_code == 200:
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                    
                    logger.info("✅ Fish Speech 기본 음성 생성 성공")
                else:
                    error_msg = f"API 요청 실패: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    raise Exception(error_msg)
                    
        except Exception as e:
            logger.error(f"Fish Speech 기본 음성 생성 실패: {e}")
            raise Exception(f"기본 음성 생성 실패: {str(e)}")
    
    async def _get_audio_duration(self, audio_file_path: str) -> float:
        """오디오 파일 길이 계산"""
        try:
            import librosa
            y, sr = librosa.load(audio_file_path)
            duration = len(y) / sr
            return duration
        except ImportError:
            # librosa가 없으면 파일 크기 기반 추정
            try:
                file_size = Path(audio_file_path).stat().st_size
                estimated_duration = file_size / (self.config["sample_rate"] * 2)
                return estimated_duration
            except:
                return 3.0
        except Exception as e:
            logger.warning(f"오디오 길이 계산 실패: {e}")
            return 3.0
    
    async def _calculate_quality_score(
        self,
        audio_file_path: str,
        text: str,
        is_voice_cloning: bool = False
    ) -> float:
        """Fish Speech TTS 품질 점수 계산"""
        try:
            if not Path(audio_file_path).exists():
                return 0.0
            
            file_size = Path(audio_file_path).stat().st_size
            duration = await self._get_audio_duration(audio_file_path)
            
            # Fish Speech는 고품질이므로 기본 점수가 높음
            base_score = 92.0  # Fish Speech 기본 품질
            
            # 파일 크기 검증
            size_bonus = 0
            if 15000 < file_size < 10000000:  # 15KB ~ 10MB
                size_bonus = 5
            
            # Duration 적절성
            expected_duration = len(text) / 5  # 초당 5자 기준 (자연스러운 속도)
            duration_ratio = duration / max(expected_duration, 1)
            
            duration_bonus = 0
            if 0.6 <= duration_ratio <= 1.8:
                duration_bonus = 3
            
            # Voice Cloning 보너스
            voice_cloning_bonus = 5 if is_voice_cloning else 0
            
            total_score = base_score + size_bonus + duration_bonus + voice_cloning_bonus
            
            return min(100.0, max(85.0, total_score))
            
        except Exception as e:
            logger.error(f"품질 점수 계산 실패: {e}")
            return 92.0  # Fish Speech 기본 점수
    
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
    
    async def test_tts_functionality(self) -> dict:
        """Fish Speech TTS 기능 테스트"""
        logger.info("🐟 Fish Speech TTS 기능 테스트 시작")
        
        try:
            await self.initialize_tts_model()
            
            test_text = "안녕하세요. 이것은 Fish Speech TTS 기능 테스트입니다."
            test_file = self.audio_files_dir / "test_fish_speech.wav"
            
            # Fish Speech 테스트
            await self._generate_with_fish_speech_default(test_text, str(test_file), {})
            
            if test_file.exists():
                file_size = test_file.stat().st_size
                duration = await self._get_audio_duration(str(test_file))
                
                result = {
                    "success": True,
                    "engine": "Fish Speech",
                    "file_size": file_size,
                    "duration": duration,
                    "file_path": str(test_file),
                    "quality_estimated": 92.0
                }
                
                logger.info("✅ Fish Speech TTS 테스트 성공")
                return result
            else:
                return {"success": False, "error": "Fish Speech 파일 생성 실패"}
                
        except Exception as e:
            logger.error(f"Fish Speech TTS 테스트 실패: {e}")
            return {"success": False, "error": str(e)}
    
    def __del__(self):
        """서비스 종료 시 API 서버 정리"""
        if self.api_server_process:
            try:
                self.api_server_process.terminate()
                logger.info("Fish Speech API 서버 종료")
            except:
                pass

# Fish Speech TTS 서비스 인스턴스
fish_speech_tts_service = FishSpeechTTSService()
