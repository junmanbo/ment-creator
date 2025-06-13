import subprocess
import sys
from pathlib import Path

# Fish Speech 가상환경 경로
fish_speech_dir = Path("/home/jun/projects/ment-creator/backend/fish_speech/fish-speech")
fish_venv_python = fish_speech_dir / ".venv" / "bin" / "python"
fish_venv_pip = fish_speech_dir / ".venv" / "bin" / "pip"

print("🔧 Fish Speech 가상환경에서 pyrootutils 설치 중...")

try:
    # pyrootutils 설치
    result = subprocess.run([
        str(fish_venv_pip), "install", "pyrootutils>=1.0.4"
    ], cwd=fish_speech_dir, capture_output=True, text=True)
    
    print("STDOUT:", result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    
    if result.returncode == 0:
        print("✅ pyrootutils 설치 성공")
    else:
        print(f"❌ pyrootutils 설치 실패 (exit code: {result.returncode})")
        
except Exception as e:
    print(f"❌ 설치 중 오류: {e}")

# 설치 확인
print("\n🔍 설치 확인 중...")
try:
    result = subprocess.run([
        str(fish_venv_python), "-c", "import pyrootutils; print(f'pyrootutils 버전: {pyrootutils.__version__}')"
    ], cwd=fish_speech_dir, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ {result.stdout.strip()}")
    else:
        print(f"❌ pyrootutils 확인 실패: {result.stderr}")
        
except Exception as e:
    print(f"❌ 확인 중 오류: {e}")
