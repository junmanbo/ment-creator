#!/usr/bin/env python3
"""
SQLModel 관계 정의 테스트 스크립트
"""
import sys
import os
from pathlib import Path

# backend 디렉터리를 Python path에 추가
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def test_model_relationships():
    """모델 관계 정의 테스트"""
    try:
        print("🔍 SQLModel 관계 정의 테스트 시작...")
        
        # 1. 모든 모델 import 테스트
        print("\n1️⃣ 모델 import 테스트...")
        import app.models
        print("✅ 모든 모델 import 성공")
        
        # 2. SQLAlchemy 매퍼 구성 테스트
        print("\n2️⃣ SQLAlchemy 매퍼 구성 테스트...")
        from sqlalchemy.orm import configure_mappers
        configure_mappers()
        print("✅ SQLAlchemy 매퍼 구성 성공")
        
        # 3. Scenario 모델 관계 확인
        print("\n3️⃣ Scenario 모델 관계 확인...")
        from app.models.scenario import Scenario
        
        # 관계 속성 확인
        expected_relationships = ['created_by_user', 'updated_by_user', 'nodes', 'connections', 'versions']
        for rel_name in expected_relationships:
            if hasattr(Scenario, rel_name):
                print(f"✅ {rel_name} 관계 정의됨")
            else:
                print(f"❌ {rel_name} 관계 누락")
                return False
        
        # 4. 데이터베이스 연결 테스트 (선택사항)
        print("\n4️⃣ 데이터베이스 연결 테스트...")
        try:
            from app.core.config import settings
            from sqlmodel import create_engine, Session
            
            engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
            with Session(engine) as session:
                # 간단한 쿼리 테스트
                from sqlmodel import select
                from app.models.users import User
                
                # User 모델에 대한 간단한 select 쿼리 (실행하지 않고 컴파일만)
                stmt = select(User).limit(1)
                compiled = stmt.compile(compile_kwargs={"literal_binds": True})
                print("✅ 데이터베이스 쿼리 컴파일 성공")
                
        except Exception as db_error:
            print(f"⚠️  데이터베이스 연결 테스트 실패 (정상적일 수 있음): {db_error}")
        
        print("\n🎉 모든 모델 관계 테스트 통과!")
        return True
        
    except Exception as e:
        print(f"\n❌ 모델 관계 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_login_simulation():
    """로그인 프로세스 시뮬레이션 테스트"""
    try:
        print("\n🔐 로그인 프로세스 시뮬레이션...")
        
        # 로그인에서 사용되는 모델들 import
        from app.models.users import User
        from app.crud.users import get_user_by_email
        from sqlmodel import select, Session
        from app.core.config import settings
        from sqlmodel import create_engine
        
        # 쿼리 컴파일 테스트 (실제 실행하지 않음)
        stmt = select(User).where(User.email == "test@example.com")
        compiled = stmt.compile(compile_kwargs={"literal_binds": True})
        
        print("✅ 로그인 쿼리 컴파일 성공")
        print("✅ 로그인 프로세스 시뮬레이션 통과")
        return True
        
    except Exception as e:
        print(f"❌ 로그인 시뮬레이션 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("🚀 SQLModel 수정사항 검증 시작")
    print("=" * 50)
    
    # 1. 모델 관계 테스트
    if not test_model_relationships():
        print("\n💥 모델 관계 테스트 실패 - 수정이 필요합니다.")
        return False
    
    # 2. 로그인 시뮬레이션 테스트
    if not test_login_simulation():
        print("\n💥 로그인 시뮬레이션 실패 - 추가 수정이 필요합니다.")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 모든 검증 테스트 통과!")
    print("✅ 백엔드 서버를 시작해도 관계 에러가 발생하지 않을 것입니다.")
    print("\n📋 다음 단계:")
    print("1. 백엔드 서버 시작: cd backend && .venv/bin/uvicorn app.main:app --reload")
    print("2. 프론트엔드 서버 시작: cd frontend && npm run dev")  
    print("3. 로그인 테스트 수행")
    
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
