#!/usr/bin/env python3
"""
Fish Speech 의존성 문제 해결 스크립트
"""
import subprocess
import sys
from pathlib import Path
import os

def run_command(cmd, cwd=None, timeout=600):
    """명령어 실행 및 결과 반환"""
    try:
        print(f"🔧 실행: {' '.join(cmd)}")
        result = subprocess.run(
            cmd, 
            cwd=cwd, 
            capture_output=True, 
            text=True, 
            timeout=timeout
        )
        
        if result.stdout:
            print(f"✅ 출력: {result.stdout[-800:]}")
        if result.stderr:
            print(f"⚠️  에러: {result.stderr[-800:]}")
            
        return result
    except subprocess.TimeoutExpired:
        print(f"⏰ 타임아웃: {timeout}초")
        return None
    except Exception as e:
        print(f"❌ 실행 오류: {e}")
        return None

def main():
    """Fish Speech 의존성 문제 해결"""
    print("🐟 Fish Speech 의존성 문제 해결 시작")
    
    # Fish Speech 경로 설정
    fish_speech_dir = Path("/home/jun/projects/ment-creator/backend/fish_speech/fish-speech")
    fish_venv_python = fish_speech_dir / ".venv" / "bin" / "python"
    fish_venv_pip = fish_speech_dir / ".venv" / "bin" / "pip"
    
    print(f"📁 Fish Speech 디렉토리: {fish_speech_dir}")
    print(f"🐍 Python 경로: {fish_venv_python}")
    
    # 디렉토리 및 파일 존재 확인
    if not fish_speech_dir.exists():
        print(f"❌ Fish Speech 디렉토리가 없습니다: {fish_speech_dir}")
        return False
        
    if not fish_venv_python.exists():
        print(f"❌ Fish Speech Python 실행파일이 없습니다: {fish_venv_python}")
        return False
    
    # 1. pip 업그레이드
    print("\n1️⃣ pip 업그레이드...")
    result = run_command([
        str(fish_venv_python), "-m", "pip", "install", "--upgrade", "pip"
    ], cwd=fish_speech_dir)
    
    if result and result.returncode != 0:
        print("⚠️  pip 업그레이드 실패, 계속 진행")
    
    # 2. wheel 및 setuptools 업그레이드
    print("\n2️⃣ wheel 및 setuptools 설치...")
    result = run_command([
        str(fish_venv_python), "-m", "pip", "install", "--upgrade", 
        "wheel", "setuptools", "setuptools-scm"
    ], cwd=fish_speech_dir)
    
    # 3. pyrootutils 직접 설치
    print("\n3️⃣ pyrootutils 직접 설치...")
    result = run_command([
        str(fish_venv_python), "-m", "pip", "install", "pyrootutils>=1.0.4"
    ], cwd=fish_speech_dir)
    
    if result and result.returncode != 0:
        print("❌ pyrootutils 설치 실패")
        return False
    
    # 4. Fish Speech 의존성 재설치
    print("\n4️⃣ Fish Speech 의존성 재설치...")
    result = run_command([
        str(fish_venv_python), "-m", "pip", "install", "-e", ".[stable]", "--upgrade"
    ], cwd=fish_speech_dir)
    
    # 5. 설치 확인
    print("\n5️⃣ 설치 확인...")
    
    # pyrootutils 확인
    print("🔍 pyrootutils 확인...")
    result = run_command([
        str(fish_venv_python), "-c", "import pyrootutils; print(f'✅ pyrootutils 버전: {pyrootutils.__version__}')"
    ], cwd=fish_speech_dir, timeout=30)
    
    if result and result.returncode != 0:
        print("❌ pyrootutils 임포트 실패")
        return False
    
    # fish_speech 확인
    print("🔍 fish_speech 확인...")
    result = run_command([
        str(fish_venv_python), "-c", "import fish_speech; print('✅ fish_speech 모듈 로드 성공')"
    ], cwd=fish_speech_dir, timeout=30)
    
    if result and result.returncode != 0:
        print("⚠️  fish_speech 모듈 로드 실패, 하지만 API 서버는 실행 가능할 수 있습니다")
    
    # 6. 현재 설치된 패키지 목록 확인
    print("\n6️⃣ 주요 패키지 확인...")
    result = run_command([
        str(fish_venv_python), "-m", "pip", "list"
    ], cwd=fish_speech_dir, timeout=30)
    
    print("\n🎉 Fish Speech 의존성 문제 해결 완료!")
    print("이제 다시 Fish Speech API 서버를 실행해보세요.")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
