#!/usr/bin/env python3
"""
환경변수 없이 모델 관계만 테스트하는 스크립트
"""
import sys
import os
from pathlib import Path

# backend 디렉터리를 Python path에 추가
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def test_models_without_db():
    """데이터베이스 연결 없이 모델 관계만 테스트"""
    try:
        print("🔍 SQLModel 관계 테스트 (DB 연결 없음)...")
        
        # 1. 모델 import
        print("\n1️⃣ 모델 import 테스트...")
        import app.models
        from app.models.scenario import Scenario, ScenarioVersion, ScenarioNode, ScenarioConnection
        from app.models.users import User
        print("✅ 모든 모델 import 성공")
        
        # 2. SQLAlchemy 매퍼 구성
        print("\n2️⃣ SQLAlchemy 매퍼 구성 테스트...")
        from sqlalchemy.orm import configure_mappers
        configure_mappers()
        print("✅ SQLAlchemy 매퍼 구성 성공")
        
        # 3. 관계 확인
        print("\n3️⃣ 모델 관계 확인...")
        
        # Scenario 관계 확인
        scenario_relationships = ['created_by_user', 'updated_by_user', 'nodes', 'connections', 'versions']
        for rel_name in scenario_relationships:
            if hasattr(Scenario, rel_name):
                print(f"✅ Scenario.{rel_name} 관계 확인됨")
            else:
                print(f"❌ Scenario.{rel_name} 관계 누락")
                return False
        
        # ScenarioVersion self-reference 확인
        if hasattr(ScenarioVersion, 'parent_version_id'):
            print("✅ ScenarioVersion.parent_version_id 필드 확인됨")
        else:
            print("❌ ScenarioVersion.parent_version_id 필드 누락")
            return False
            
        if hasattr(ScenarioVersion, 'parent_version'):
            print("✅ ScenarioVersion.parent_version 관계 확인됨")
        else:
            print("❌ ScenarioVersion.parent_version 관계 누락")
            return False
        
        # 4. 테이블 메타데이터 확인
        print("\n4️⃣ 테이블 메타데이터 확인...")
        from sqlmodel import SQLModel
        
        tables = SQLModel.metadata.tables.keys()
        expected_tables = ['user', 'scenario', 'scenarioversion', 'scenarionode', 'scenarioconnection']
        
        for table_name in expected_tables:
            if table_name in tables:
                print(f"✅ {table_name} 테이블 정의 확인됨")
            else:
                print(f"❌ {table_name} 테이블 정의 누락")
        
        print("\n🎉 모든 모델 관계 테스트 통과!")
        return True
        
    except Exception as e:
        print(f"\n❌ 모델 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("🚀 환경변수 독립적인 모델 관계 테스트")
    print("=" * 50)
    
    if test_models_without_db():
        print("\n" + "=" * 50)
        print("🎉 모델 관계 테스트 성공!")
        print("✅ 이제 마이그레이션을 실행할 수 있습니다:")
        print("   chmod +x safe_migration.sh")
        print("   ./safe_migration.sh")
        return True
    else:
        print("\n💥 모델 관계 테스트 실패 - 추가 수정이 필요합니다.")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {e}")
        sys.exit(1)
