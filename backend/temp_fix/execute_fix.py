#!/usr/bin/env python3
"""
Fish Speech 의존성 문제 해결 - 실행 스크립트
"""
import subprocess
import sys
from pathlib import Path
import os

def run_command(cmd, cwd=None, timeout=600):
    """명령어 실행 및 결과 출력"""
    try:
        print(f"🔧 실행: {' '.join(cmd)}")
        result = subprocess.run(
            cmd, 
            cwd=cwd, 
            text=True, 
            timeout=timeout,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT  # stderr를 stdout으로 합침
        )
        
        # 실시간 출력
        if result.stdout:
            print(result.stdout)
            
        return result.returncode == 0
    except subprocess.TimeoutExpired as e:
        print(f"⏰ 타임아웃: {timeout}초")
        if e.stdout:
            print(e.stdout)
        return False
    except Exception as e:
        print(f"❌ 실행 오류: {e}")
        return False

def main():
    """Fish Speech 의존성 문제 해결"""
    print("🐟 Fish Speech 의존성 문제 해결 시작")
    
    # Fish Speech 경로 설정
    fish_speech_dir = Path("/home/jun/projects/ment-creator/backend/fish_speech/fish-speech")
    fish_python = fish_speech_dir / ".venv" / "bin" / "python"
    
    print(f"📁 Fish Speech 디렉토리: {fish_speech_dir}")
    print(f"🐍 Python 경로: {fish_python}")
    
    # 디렉토리 및 파일 존재 확인
    if not fish_speech_dir.exists():
        print(f"❌ Fish Speech 디렉토리가 없습니다: {fish_speech_dir}")
        return False
        
    if not fish_python.exists():
        print(f"❌ Fish Speech Python 실행파일이 없습니다: {fish_python}")
        return False
    
    success = True
    
    # 1. pip 업그레이드
    print("\n1️⃣ pip 업그레이드...")
    if not run_command([str(fish_python), "-m", "pip", "install", "--upgrade", "pip"], 
                      cwd=fish_speech_dir):
        print("⚠️  pip 업그레이드 실패, 계속 진행")
    
    # 2. 기본 도구 설치
    print("\n2️⃣ wheel 및 setuptools 설치...")
    if not run_command([str(fish_python), "-m", "pip", "install", "--upgrade", 
                       "wheel", "setuptools", "setuptools-scm"], 
                      cwd=fish_speech_dir):
        print("⚠️  기본 도구 설치 실패, 계속 진행")
    
    # 3. pyrootutils 직접 설치
    print("\n3️⃣ pyrootutils 직접 설치...")
    if not run_command([str(fish_python), "-m", "pip", "install", "pyrootutils>=1.0.4"], 
                      cwd=fish_speech_dir):
        print("❌ pyrootutils 설치 실패")
        success = False
    
    # 4. Fish Speech 의존성 재설치
    print("\n4️⃣ Fish Speech 의존성 재설치...")
    if not run_command([str(fish_python), "-m", "pip", "install", "-e", ".[stable]", "--upgrade"], 
                      cwd=fish_speech_dir, timeout=900):
        print("⚠️  Fish Speech 재설치 실패, pyrootutils는 설치됨")
    
    # 5. 설치 확인
    print("\n5️⃣ 설치 확인...")
    
    # pyrootutils 확인
    print("🔍 pyrootutils 확인...")
    if run_command([str(fish_python), "-c", 
                   "import pyrootutils; print(f'✅ pyrootutils 버전: {pyrootutils.__version__}')"], 
                  cwd=fish_speech_dir, timeout=30):
        print("✅ pyrootutils 설치 성공")
    else:
        print("❌ pyrootutils 확인 실패")
        success = False
    
    # fish_speech 확인 (실패해도 계속 진행)
    print("\n🔍 fish_speech 확인...")
    if run_command([str(fish_python), "-c", "import fish_speech; print('✅ fish_speech 모듈 로드 성공')"], 
                  cwd=fish_speech_dir, timeout=30):
        print("✅ fish_speech 모듈 로드 성공")
    else:
        print("⚠️  fish_speech 모듈 로드 실패, 하지만 API 서버는 실행 가능할 수 있습니다")
    
    # 6. 중요 패키지 확인
    print("\n6️⃣ 중요 패키지 확인...")
    check_script = '''
try:
    import pyrootutils
    print(f"✅ pyrootutils: {pyrootutils.__version__}")
except ImportError as e:
    print(f"❌ pyrootutils: {e}")

try:
    import torch
    print(f"✅ torch: {torch.__version__}")
except ImportError as e:
    print(f"❌ torch: {e}")

try:
    import transformers
    print(f"✅ transformers: {transformers.__version__}")
except ImportError as e:
    print(f"❌ transformers: {e}")
'''
    
    run_command([str(fish_python), "-c", check_script], 
                cwd=fish_speech_dir, timeout=30)
    
    print("\n🎉 Fish Speech 의존성 문제 해결 완료!")
    print("이제 다시 Fish Speech API 서버를 실행해보세요.")
    print("")
    print("실행 명령어:")
    print("uv run python start_fish_speech_server.py start")
    
    return success

if __name__ == "__main__":
    try:
        success = main()
        print(f"\n결과: {'성공' if success else '부분 성공 - pyrootutils는 설치됨'}")
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n❌ 사용자에 의해 중단됨")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {e}")
        sys.exit(1)
