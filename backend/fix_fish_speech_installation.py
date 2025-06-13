#!/usr/bin/env python3
"""
Fish Speech 설치 문제 해결 스크립트
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FishSpeechInstaller:
    def __init__(self):
        self.backend_dir = Path(__file__).parent
        self.fish_speech_dir = self.backend_dir / "fish_speech" / "fish-speech"
        self.fish_venv = self.fish_speech_dir / ".venv"
        
        # 가상환경의 Python과 pip 경로
        if os.name == 'nt':  # Windows
            self.python_path = self.fish_venv / "Scripts" / "python.exe"
            self.pip_path = self.fish_venv / "Scripts" / "pip.exe"
        else:  # Linux/Mac
            self.python_path = self.fish_venv / "bin" / "python"
            self.pip_path = self.fish_venv / "bin" / "pip"
    
    def check_pyrootutils(self):
        """pyrootutils 모듈 설치 확인"""
        try:
            result = subprocess.run(
                [str(self.python_path), "-c", "import pyrootutils; print(pyrootutils.__version__)"],
                capture_output=True,
                text=True,
                cwd=self.fish_speech_dir
            )
            if result.returncode == 0:
                logger.info(f"✅ pyrootutils 설치됨: {result.stdout.strip()}")
                return True
            else:
                logger.error(f"❌ pyrootutils 미설치: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"❌ pyrootutils 확인 실패: {e}")
            return False
    
    def install_pytorch(self):
        """PyTorch 설치"""
        logger.info("🔧 PyTorch 설치 중...")
        try:
            # Context7에서 확인한 Fish Speech 권장 PyTorch 버전
            cmd = [
                str(self.pip_path), "install",
                "torch==2.4.1",
                "torchvision==0.19.1", 
                "torchaudio==2.4.1",
                "--index-url", "https://download.pytorch.org/whl/cu121"
            ]
            
            result = subprocess.run(cmd, cwd=self.fish_speech_dir, check=True)
            logger.info("✅ PyTorch 설치 완료")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ PyTorch 설치 실패: {e}")
            return False
    
    def install_fish_speech_dependencies(self):
        """Fish Speech 의존성 설치"""
        logger.info("🔧 Fish Speech 의존성 설치 중...")
        try:
            # Context7에서 확인한 설치 방법: pip install -e .[stable]
            cmd = [str(self.pip_path), "install", "-e", ".[stable]"]
            
            result = subprocess.run(cmd, cwd=self.fish_speech_dir, check=True)
            logger.info("✅ Fish Speech 의존성 설치 완료")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Fish Speech 의존성 설치 실패: {e}")
            return False
    
    def install_pyrootutils_manually(self):
        """pyrootutils 수동 설치"""
        logger.info("🔧 pyrootutils 수동 설치 중...")
        try:
            cmd = [str(self.pip_path), "install", "pyrootutils>=1.0.4"]
            result = subprocess.run(cmd, cwd=self.fish_speech_dir, check=True)
            logger.info("✅ pyrootutils 수동 설치 완료")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ pyrootutils 수동 설치 실패: {e}")
            return False
    
    def upgrade_pip(self):
        """pip 업그레이드"""
        logger.info("🔧 pip 업그레이드 중...")
        try:
            cmd = [str(self.python_path), "-m", "pip", "install", "--upgrade", "pip"]
            result = subprocess.run(cmd, cwd=self.fish_speech_dir, check=True)
            logger.info("✅ pip 업그레이드 완료")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ pip 업그레이드 실패: {e}")
            return False
    
    def check_installation(self):
        """설치 상태 확인"""
        logger.info("🔍 Fish Speech 설치 상태 확인")
        
        # 1. 가상환경 확인
        if not self.fish_venv.exists():
            logger.error("❌ Fish Speech 가상환경이 없습니다")
            return False
        
        # 2. Python 경로 확인
        if not self.python_path.exists():
            logger.error(f"❌ Python 실행파일을 찾을 수 없습니다: {self.python_path}")
            return False
        
        # 3. pip 경로 확인
        if not self.pip_path.exists():
            logger.error(f"❌ pip 실행파일을 찾을 수 없습니다: {self.pip_path}")
            return False
        
        # 4. pyrootutils 확인
        if not self.check_pyrootutils():
            return False
        
        # 5. fish_speech 모듈 확인
        try:
            result = subprocess.run(
                [str(self.python_path), "-c", "import fish_speech; print('Fish Speech 모듈 로드 성공')"],
                capture_output=True,
                text=True,
                cwd=self.fish_speech_dir
            )
            if result.returncode == 0:
                logger.info("✅ Fish Speech 모듈 로드 성공")
            else:
                logger.error(f"❌ Fish Speech 모듈 로드 실패: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"❌ Fish Speech 모듈 확인 실패: {e}")
            return False
        
        logger.info("✅ Fish Speech 설치 상태 정상")
        return True
    
    def fix_installation(self):
        """설치 문제 해결"""
        logger.info("🛠️  Fish Speech 설치 문제 해결 시작")
        
        # 1. pip 업그레이드
        if not self.upgrade_pip():
            return False
        
        # 2. pyrootutils가 없으면 수동 설치
        if not self.check_pyrootutils():
            if not self.install_pyrootutils_manually():
                return False
        
        # 3. PyTorch 설치 (재설치)
        if not self.install_pytorch():
            # CUDA 버전이 없으면 CPU 버전으로 시도
            logger.info("CUDA 버전 설치 실패, CPU 버전으로 재시도")
            try:
                cmd = [
                    str(self.pip_path), "install",
                    "torch==2.4.1",
                    "torchvision==0.19.1", 
                    "torchaudio==2.4.1"
                ]
                subprocess.run(cmd, cwd=self.fish_speech_dir, check=True)
                logger.info("✅ PyTorch CPU 버전 설치 완료")
            except subprocess.CalledProcessError as e:
                logger.error(f"❌ PyTorch CPU 버전 설치도 실패: {e}")
                return False
        
        # 4. Fish Speech 의존성 재설치
        if not self.install_fish_speech_dependencies():
            return False
        
        # 5. 최종 확인
        return self.check_installation()

def main():
    """메인 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fish Speech 설치 문제 해결")
    parser.add_argument("action", choices=["check", "fix"], 
                       help="수행할 작업 (check: 상태 확인, fix: 문제 해결)")
    
    args = parser.parse_args()
    
    installer = FishSpeechInstaller()
    
    if args.action == "check":
        success = installer.check_installation()
        sys.exit(0 if success else 1)
    
    elif args.action == "fix":
        success = installer.fix_installation()
        if success:
            logger.info("🎉 Fish Speech 설치 문제 해결 완료!")
        else:
            logger.error("❌ Fish Speech 설치 문제 해결 실패")
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
