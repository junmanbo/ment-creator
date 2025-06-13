#!/usr/bin/env python3
"""
Fish Speech 설치 및 설정 스크립트
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_command(cmd, check=True):
    """명령어 실행"""
    logger.info(f"실행: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, check=check, capture_output=True, text=True)
        if result.stdout:
            logger.info(f"OUTPUT: {result.stdout}")
        return result
    except subprocess.CalledProcessError as e:
        logger.error(f"명령어 실행 실패: {cmd}")
        logger.error(f"Error: {e.stderr}")
        if check:
            raise
        return e

def main():
    """Fish Speech 설치 메인 함수"""
    logger.info("🐟 Fish Speech 설치 시작")
    
    # 현재 작업 디렉토리 확인
    backend_dir = Path(__file__).parent
    project_root = backend_dir.parent
    
    logger.info(f"Backend 디렉토리: {backend_dir}")
    logger.info(f"프로젝트 루트: {project_root}")
    
    # Fish Speech 디렉토리 생성
    fish_speech_dir = backend_dir / "fish_speech"
    fish_speech_dir.mkdir(exist_ok=True)
    
    os.chdir(fish_speech_dir)
    logger.info(f"작업 디렉토리 변경: {fish_speech_dir}")
    
    try:
        # 1. Fish Speech 리포지토리 클론
        if not (fish_speech_dir / "fish-speech").exists():
            logger.info("1. Fish Speech 리포지토리 클론")
            run_command("git clone https://github.com/fishaudio/fish-speech.git")
        else:
            logger.info("1. Fish Speech 리포지토리 이미 존재 - 업데이트")
            os.chdir(fish_speech_dir / "fish-speech")
            run_command("git pull")
        
        # fish-speech 디렉토리로 이동
        os.chdir(fish_speech_dir / "fish-speech")
        
        # 2. Python 버전 확인
        logger.info("2. Python 버전 확인")
        python_version = sys.version_info
        logger.info(f"Python 버전: {python_version.major}.{python_version.minor}.{python_version.micro}")
        
        if python_version >= (3, 12):
            logger.warning("⚠️  Python 3.12+ 감지. Fish Speech는 Python 3.11 이하를 권장합니다.")
        
        # 3. 의존성 설치
        logger.info("3. Fish Speech 의존성 설치")
        
        # Fish Speech 설치 (개발 모드)
        run_command("pip install -e .")
        
        # 추가 의존성 설치
        logger.info("4. 추가 의존성 설치")
        run_command("pip install numpy scipy librosa soundfile torchaudio")
        
        # 5. 모델 다운로드 디렉토리 생성
        logger.info("5. 모델 저장 디렉토리 생성")
        checkpoints_dir = fish_speech_dir / "fish-speech" / "checkpoints"
        checkpoints_dir.mkdir(exist_ok=True)
        
        # OpenAudio S1-mini 모델 다운로드 (작은 버전부터)
        logger.info("6. OpenAudio S1-mini 모델 다운로드")
        model_dir = checkpoints_dir / "openaudio-s1-mini"
        
        if not model_dir.exists():
            try:
                # Hugging Face CLI 설치
                run_command("pip install huggingface_hub[cli]")
                
                # 모델 다운로드
                run_command(f"huggingface-cli download fishaudio/fish-speech-1.5 --local-dir {model_dir}")
                logger.info(f"✅ 모델 다운로드 완료: {model_dir}")
                
            except Exception as e:
                logger.warning(f"모델 자동 다운로드 실패: {e}")
                logger.info("수동으로 다운로드해주세요:")
                logger.info("huggingface-cli download fishaudio/fish-speech-1.5 --local-dir checkpoints/openaudio-s1-mini")
        else:
            logger.info("✅ 모델이 이미 존재합니다")
        
        # 6. 설치 확인
        logger.info("7. 설치 확인")
        
        # Fish Speech 모듈 확인
        try:
            import fish_speech
            logger.info("✅ Fish Speech 모듈 설치 확인")
        except ImportError as e:
            logger.warning(f"⚠️  Fish Speech 모듈 import 실패: {e}")
        
        # PyTorch 확인
        try:
            import torch
            logger.info(f"✅ PyTorch 설치 확인: {torch.__version__}")
            if torch.cuda.is_available():
                logger.info(f"✅ CUDA 사용 가능: {torch.cuda.device_count()}개 GPU")
            else:
                logger.info("ℹ️  CUDA 사용 불가 - CPU 모드로 실행")
        except ImportError:
            logger.error("❌ PyTorch 설치 실패")
        
        # 7. 구성 파일 생성
        logger.info("8. Fish Speech 구성 파일 생성")
        config_file = backend_dir / "fish_speech_config.py"
        
        config_content = f'''"""
Fish Speech 구성 파일
"""

import os
from pathlib import Path

# 기본 경로 설정
FISH_SPEECH_DIR = Path(__file__).parent / "fish_speech" / "fish-speech"
CHECKPOINTS_DIR = FISH_SPEECH_DIR / "checkpoints"
MODEL_DIR = CHECKPOINTS_DIR / "openaudio-s1-mini"

# API 서버 설정
API_HOST = "127.0.0.1"
API_PORT = 8765
API_URL = f"http://{{API_HOST}}:{{API_PORT}}"

# 모델 설정
LLAMA_CHECKPOINT_PATH = str(MODEL_DIR)
DECODER_CHECKPOINT_PATH = str(MODEL_DIR / "codec.pth")
DECODER_CONFIG_NAME = "modded_dac_vq"

# TTS 생성 설정
DEFAULT_LANGUAGE = "ko"
DEFAULT_TEMPERATURE = 0.7
DEFAULT_TOP_P = 0.85
DEFAULT_TOP_K = 50
DEFAULT_REPETITION_PENALTY = 1.1

# 파일 경로
AUDIO_OUTPUT_DIR = Path(__file__).parent / "audio_files"
VOICE_SAMPLES_DIR = Path(__file__).parent / "voice_samples"

# 생성 설정
MAX_GENERATION_TIME = 120  # 최대 2분
SAMPLE_RATE = 22050
AUDIO_FORMAT = "wav"

print("Fish Speech 구성 로드 완료")
print(f"모델 디렉토리: {{MODEL_DIR}}")
print(f"Fish Speech 디렉토리: {{FISH_SPEECH_DIR}}")
'''
        
        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(config_content)
        
        logger.info(f"✅ 구성 파일 생성: {config_file}")
        
        # 8. 완료 메시지
        logger.info("🎉 Fish Speech 설치 완료!")
        logger.info("다음 단계:")
        logger.info("1. API 서버 시작: python -m tools.api_server --llama-checkpoint-path checkpoints/openaudio-s1-mini")
        logger.info("2. TTS 서비스 업데이트")
        logger.info("3. 테스트 실행")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Fish Speech 설치 실패: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
