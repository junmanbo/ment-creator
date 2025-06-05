#!/usr/bin/env python3
"""
Alembic Multiple Heads 문제 해결 스크립트
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
    backend_dir = Path(__file__).parent / "backend"
    if not backend_dir.exists():
        print("❌ backend 디렉터리를 찾을 수 없습니다.")
        sys.exit(1)
    
    print("🔧 Multiple Heads 문제 해결 시작...")
    print(f"📁 작업 디렉터리: {backend_dir}")
    
    # 1. 현재 상태 확인
    print("\n1️⃣ 현재 마이그레이션 상태 확인...")
    success, output = run_command(".venv/bin/alembic current", cwd=backend_dir)
    if success:
        print(f"✅ 현재 상태: {output.strip()}")
    else:
        print(f"❌ 상태 확인 실패: {output}")
        return False
    
    # 2. 모든 heads 확인
    print("\n2️⃣ 모든 head revisions 확인...")
    success, output = run_command(".venv/bin/alembic heads", cwd=backend_dir)
    if success:
        print("✅ Head revisions:")
        print(output)
        heads = [line.split()[0] for line in output.strip().split('\n') if line.strip()]
        print(f"발견된 heads: {heads}")
    else:
        print(f"❌ heads 확인 실패: {output}")
        return False
    
    # 3. 각 head로 개별 업그레이드
    if len(heads) >= 2:
        print(f"\n3️⃣ 첫 번째 head ({heads[0]})로 업그레이드...")
        success, output = run_command(f".venv/bin/alembic upgrade {heads[0]}", cwd=backend_dir)
        if success:
            print("✅ 첫 번째 head 업그레이드 성공!")
        else:
            print(f"❌ 첫 번째 head 업그레이드 실패: {output}")
            return False
        
        print(f"\n4️⃣ 두 번째 head ({heads[1]})로 업그레이드...")
        success, output = run_command(f".venv/bin/alembic upgrade {heads[1]}", cwd=backend_dir)
        if success:
            print("✅ 두 번째 head 업그레이드 성공!")
        else:
            print(f"❌ 두 번째 head 업그레이드 실패: {output}")
            return False
    
    # 4. Merge migration 생성
    print(f"\n5️⃣ Merge migration 생성...")
    heads_str = " ".join(heads)
    success, output = run_command(f'.venv/bin/alembic merge {heads_str} -m "Merge multiple heads"', cwd=backend_dir)
    if success:
        print("✅ Merge migration 생성 성공!")
        print(output)
    else:
        print(f"❌ Merge migration 생성 실패: {output}")
        return False
    
    # 5. 최종 업그레이드
    print("\n6️⃣ 최종 업그레이드...")
    success, output = run_command(".venv/bin/alembic upgrade head", cwd=backend_dir)
    if success:
        print("✅ 최종 업그레이드 성공!")
        print(output)
    else:
        print(f"❌ 최종 업그레이드 실패: {output}")
        return False
    
    # 6. 최종 상태 확인
    print("\n7️⃣ 최종 상태 확인...")
    success, output = run_command(".venv/bin/alembic current", cwd=backend_dir)
    if success:
        print(f"✅ 최종 상태: {output.strip()}")
    else:
        print(f"❌ 최종 상태 확인 실패: {output}")
        return False
    
    print("\n🎉 Multiple heads 문제가 성공적으로 해결되었습니다!")
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
