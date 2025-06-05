#!/usr/bin/env python3
"""
Self-referential relationship 수정 테스트
"""
import sys
import os
from pathlib import Path

# backend 디렉터리를 Python path에 추가
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def test_scenario_version_fix():
    """ScenarioVersion self-referential relationship 테스트"""
    try:
        print("🔍 ScenarioVersion self-referential relationship 테스트...")
        
        # 1. 모델 import
        print("\n1️⃣ 모델 import...")
        from app.models.scenario import ScenarioVersion, ScenarioVersionBase
        print("✅ ScenarioVersion 모델 import 성공")
        
        # 2. 필드 확인
        print("\n2️⃣ 필드 확인...")
        # ScenarioVersionBase에 parent_version_id가 없는지 확인
        base_fields = ScenarioVersionBase.__annotations__.keys()
        if 'parent_version_id' in base_fields:
            print("❌ ScenarioVersionBase에 parent_version_id가 여전히 있음")
            return False
        else:
            print("✅ ScenarioVersionBase에서 parent_version_id 제거됨")
        
        # ScenarioVersion에 parent_version_id가 있는지 확인
        version_fields = ScenarioVersion.__annotations__.keys()
        if 'parent_version_id' in version_fields:
            print("✅ ScenarioVersion에 parent_version_id 추가됨")
        else:
            print("❌ ScenarioVersion에 parent_version_id가 없음")
            return False
        
        # 3. SQLAlchemy 매퍼 구성 테스트
        print("\n3️⃣ SQLAlchemy 매퍼 구성 테스트...")
        from sqlalchemy.orm import configure_mappers
        configure_mappers()
        print("✅ SQLAlchemy 매퍼 구성 성공")
        
        # 4. 관계 확인
        print("\n4️⃣ 관계 확인...")
        if hasattr(ScenarioVersion, 'parent_version'):
            print("✅ parent_version 관계 정의됨")
        else:
            print("❌ parent_version 관계 누락")
            return False
        
        print("\n🎉 ScenarioVersion 수정 테스트 통과!")
        return True
        
    except Exception as e:
        print(f"\n❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("🚀 Self-referential relationship 수정 검증")
    print("=" * 50)
    
    if test_scenario_version_fix():
        print("\n" + "=" * 50)
        print("🎉 수정 검증 성공!")
        print("✅ 이제 마이그레이션을 생성하고 적용하세요:")
        print("   chmod +x fix_self_reference.sh")
        print("   ./fix_self_reference.sh")
    else:
        print("\n💥 수정 검증 실패 - 추가 수정이 필요합니다.")
    
    return True

if __name__ == "__main__":
    try:
        main()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {e}")
        sys.exit(1)
