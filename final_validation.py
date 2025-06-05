#!/usr/bin/env python3
"""
최종 SQLModel 관계 에러 해결 검증 스크립트
"""
import sys
import os
import subprocess
from pathlib import Path

# backend 디렉터리를 Python path에 추가
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def run_command(cmd, cwd=None):
    """명령어 실행"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, check=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def test_model_imports():
    """모델 import 테스트"""
    try:
        print("1️⃣ 모델 import 테스트...")
        import app.models
        from app.models.scenario import Scenario, ScenarioVersion
        from app.models.users import User
        print("✅ 모든 모델 import 성공")
        return True
    except Exception as e:
        print(f"❌ 모델 import 실패: {e}")
        return False

def test_sqlalchemy_configuration():
    """SQLAlchemy 매퍼 구성 테스트"""
    try:
        print("\n2️⃣ SQLAlchemy 매퍼 구성 테스트...")
        from sqlalchemy.orm import configure_mappers
        configure_mappers()
        print("✅ SQLAlchemy 매퍼 구성 성공")
        return True
    except Exception as e:
        print(f"❌ SQLAlchemy 매퍼 구성 실패: {e}")
        return False

def test_scenario_relationships():
    """Scenario 모델 관계 테스트"""
    try:
        print("\n3️⃣ Scenario 관계 테스트...")
        from app.models.scenario import Scenario
        
        required_relationships = ['created_by_user', 'updated_by_user', 'nodes', 'connections', 'versions']
        for rel_name in required_relationships:
            if hasattr(Scenario, rel_name):
                print(f"✅ {rel_name} 관계 확인됨")
            else:
                print(f"❌ {rel_name} 관계 누락")
                return False
        return True
    except Exception as e:
        print(f"❌ Scenario 관계 테스트 실패: {e}")
        return False

def test_scenario_version_self_reference():
    """ScenarioVersion self-referential relationship 테스트"""
    try:
        print("\n4️⃣ ScenarioVersion self-reference 테스트...")
        from app.models.scenario import ScenarioVersion
        
        # parent_version_id 필드 확인
        if hasattr(ScenarioVersion, 'parent_version_id'):
            print("✅ parent_version_id 필드 확인됨")
        else:
            print("❌ parent_version_id 필드 누락")
            return False
        
        # parent_version 관계 확인
        if hasattr(ScenarioVersion, 'parent_version'):
            print("✅ parent_version 관계 확인됨")
        else:
            print("❌ parent_version 관계 누락")
            return False
        
        return True
    except Exception as e:
        print(f"❌ ScenarioVersion 테스트 실패: {e}")
        return False

def test_database_query_compilation():
    """데이터베이스 쿼리 컴파일 테스트"""
    try:
        print("\n5️⃣ 쿼리 컴파일 테스트...")
        from sqlmodel import select
        from app.models.users import User
        from app.models.scenario import Scenario, ScenarioVersion
        
        # 기본 쿼리들
        queries = [
            select(User).limit(1),
            select(Scenario).limit(1),
            select(ScenarioVersion).limit(1),
        ]
        
        for i, query in enumerate(queries, 1):
            compiled = query.compile(compile_kwargs={"literal_binds": True})
            print(f"✅ 쿼리 {i} 컴파일 성공")
        
        return True
    except Exception as e:
        print(f"❌ 쿼리 컴파일 테스트 실패: {e}")
        return False

def check_migration_status():
    """마이그레이션 상태 확인"""
    try:
        print("\n6️⃣ 마이그레이션 상태 확인...")
        success, output = run_command(".venv/bin/alembic current", cwd=backend_dir)
        if success:
            print(f"✅ 현재 마이그레이션: {output.strip()}")
            return True
        else:
            print(f"⚠️ 마이그레이션 상태 확인 실패: {output}")
            return False
    except Exception as e:
        print(f"❌ 마이그레이션 상태 확인 에러: {e}")
        return False

def main():
    print("🚀 최종 SQLModel 관계 에러 해결 검증")
    print("=" * 60)
    
    tests = [
        ("모델 Import", test_model_imports),
        ("SQLAlchemy 구성", test_sqlalchemy_configuration),
        ("Scenario 관계", test_scenario_relationships),
        ("ScenarioVersion Self-Reference", test_scenario_version_self_reference),
        ("쿼리 컴파일", test_database_query_compilation),
        ("마이그레이션 상태", check_migration_status),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
                print(f"💥 {test_name} 테스트 실패")
        except Exception as e:
            failed += 1
            print(f"💥 {test_name} 테스트 에러: {e}")
    
    print("\n" + "=" * 60)
    print(f"📊 테스트 결과: ✅ {passed}개 성공, ❌ {failed}개 실패")
    
    if failed == 0:
        print("\n🎉 모든 테스트 통과!")
        print("✅ 이제 백엔드 서버를 시작할 수 있습니다:")
        print("   cd backend")
        print("   .venv/bin/uvicorn app.main:app --reload")
        print("\n✅ 또는 새로운 마이그레이션이 필요하다면:")
        print("   chmod +x fix_self_reference.sh")
        print("   ./fix_self_reference.sh")
        return True
    else:
        print(f"\n💥 {failed}개 테스트 실패 - 추가 수정이 필요합니다.")
        
        if failed == 1 and "마이그레이션" in str(failed):
            print("\n💡 해결책: 마이그레이션을 생성하고 적용하세요:")
            print("   ./fix_self_reference.sh")
        
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ 사용자에 의해 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
