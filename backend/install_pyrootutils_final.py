#!/usr/bin/env python3
import subprocess
import sys
from pathlib import Path

def install_pyrootutils():
    """Fish Speech 가상환경에 pyrootutils 설치"""
    fish_speech_dir = Path("/home/jun/projects/ment-creator/backend/fish_speech/fish-speech")
    fish_venv_python = fish_speech_dir / ".venv" / "bin" / "python"
    
    print(f"🔧 Fish Speech 디렉토리: {fish_speech_dir}")
    print(f"🐍 Python 경로: {fish_venv_python}")
    
    if not fish_venv_python.exists():
        print(f"❌ Python 실행파일을 찾을 수 없습니다: {fish_venv_python}")
        return False
    
    print("\n1️⃣ pip 설치 확인 및 업그레이드...")
    try:
        # pip 업그레이드
        result = subprocess.run([
            str(fish_venv_python), "-m", "pip", "install", "--upgrade", "pip"
        ], cwd=fish_speech_dir, capture_output=True, text=True, timeout=300)
        
        print("pip 업그레이드 결과:")
        print("STDOUT:", result.stdout[-500:] if len(result.stdout) > 500 else result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr[-500:] if len(result.stderr) > 500 else result.stderr)
        
        if result.returncode != 0:
            print(f"⚠️  pip 업그레이드 실패 (exit code: {result.returncode}), 계속 진행")
            
    except Exception as e:
        print(f"⚠️  pip 업그레이드 중 오류: {e}, 계속 진행")
    
    print("\n2️⃣ pyrootutils 설치...")
    try:
        result = subprocess.run([
            str(fish_venv_python), "-m", "pip", "install", "pyrootutils>=1.0.4"
        ], cwd=fish_speech_dir, capture_output=True, text=True, timeout=300)
        
        print("pyrootutils 설치 결과:")
        print("STDOUT:", result.stdout[-500:] if len(result.stdout) > 500 else result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr[-500:] if len(result.stderr) > 500 else result.stderr)
        
        if result.returncode == 0:
            print("✅ pyrootutils 설치 성공")
        else:
            print(f"❌ pyrootutils 설치 실패 (exit code: {result.returncode})")
            return False
            
    except Exception as e:
        print(f"❌ pyrootutils 설치 중 오류: {e}")
        return False
    
    print("\n3️⃣ 설치 확인...")
    try:
        result = subprocess.run([
            str(fish_venv_python), "-c", "import pyrootutils; print(f'✅ pyrootutils 버전: {pyrootutils.__version__}')"
        ], cwd=fish_speech_dir, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print(result.stdout.strip())
        else:
            print(f"❌ pyrootutils 확인 실패: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ pyrootutils 확인 중 오류: {e}")
        return False
    
    print("\n4️⃣ Fish Speech 의존성 재설치...")
    try:
        result = subprocess.run([
            str(fish_venv_python), "-m", "pip", "install", "-e", ".[stable]"
        ], cwd=fish_speech_dir, capture_output=True, text=True, timeout=600)
        
        print("Fish Speech 설치 결과:")
        print("STDOUT:", result.stdout[-1000:] if len(result.stdout) > 1000 else result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr[-1000:] if len(result.stderr) > 1000 else result.stderr)
        
        if result.returncode == 0:
            print("✅ Fish Speech 의존성 재설치 성공")
        else:
            print(f"⚠️  Fish Speech 재설치 실패 (exit code: {result.returncode}), pyrootutils는 설치됨")
            
    except Exception as e:
        print(f"⚠️  Fish Speech 재설치 중 오류: {e}, pyrootutils는 설치됨")
        
    print("\n5️⃣ 최종 확인...")
    try:
        result = subprocess.run([
            str(fish_venv_python), "-c", "import fish_speech; print('✅ Fish Speech 모듈 로드 성공')"
        ], cwd=fish_speech_dir, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print(result.stdout.strip())
        else:
            print(f"⚠️  Fish Speech 모듈 로드 실패: {result.stderr}")
            print("하지만 pyrootutils는 설치되었으므로 API 서버 실행은 가능할 것입니다.")
            
    except Exception as e:
        print(f"⚠️  Fish Speech 모듈 확인 중 오류: {e}")
        print("하지만 pyrootutils는 설치되었으므로 API 서버 실행은 가능할 것입니다.")
    
    print("\n🎉 설치 작업 완료!")
    return True

if __name__ == "__main__":
    success = install_pyrootutils()
    print(f"\n결과: {'성공' if success else '실패'}")
    sys.exit(0 if success else 1)
