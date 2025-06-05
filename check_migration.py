#!/usr/bin/env python3
"""
Alembic 마이그레이션 검증 스크립트
"""
import sys
import os
import subprocess
from pathlib import Path

def run_command(cmd, cwd=None):
    """명령어 실행 및 결과 반환"""
    try:
        result = subprocess.run(
            cmd, shell=True, cwd=cwd, 
            capture_output=True, text=True, check=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def main():
    # backend 디렉터리로 이동
    backend_dir = Path(__file__).parent / "backend"
    if not backend_dir.exists():
        print("❌ backend 디렉터리를 찾을 수 없습니다.")
        sys.exit(1)
    
    print("🔍 Alembic 마이그레이션 검증 시작...")
    print(f"📁 작업 디렉터리: {backend_dir}")
    
    # 1. alembic 현재 상태 확인
    print("\n1️⃣ 현재 마이그레이션 상태 확인...")
    success, output = run_command(".venv/bin/alembic current", cwd=backend_dir)
    if success:
        print(f"✅ 현재 상태: {output.strip()}")
    else:
        print(f"❌ 상태 확인 실패: {output}")
        return False
    
    # 2. 히스토리 확인
    print("\n2️⃣ 마이그레이션 히스토리 확인...")
    success, output = run_command(".venv/bin/alembic history", cwd=backend_dir)
    if success:
        print("✅ 마이그레이션 히스토리:")
        print(output)
    else:
        print(f"❌ 히스토리 확인 실패: {output}")
    
    # 3. 마이그레이션 실행
    print("\n3️⃣ 마이그레이션 실행...")
    success, output = run_command(".venv/bin/alembic upgrade head", cwd=backend_dir)
    if success:
        print("✅ 마이그레이션 성공!")
        print(output)
    else:
        print(f"❌ 마이그레이션 실패: {output}")
        return False
    
    # 4. 최종 상태 확인
    print("\n4️⃣ 최종 상태 확인...")
    success, output = run_command(".venv/bin/alembic current", cwd=backend_dir)
    if success:
        print(f"✅ 최종 상태: {output.strip()}")
    else:
        print(f"❌ 최종 상태 확인 실패: {output}")
        return False
    
    print("\n🎉 모든 마이그레이션이 성공적으로 완료되었습니다!")
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  사용자에 의해 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류 발생: {e}")
        sys.exit(1)
