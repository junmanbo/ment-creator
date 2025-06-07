#!/usr/bin/env python3
"""
데이터베이스 테이블 확인 및 초기화 스크립트
"""

import asyncio
import logging
from sqlmodel import SQLModel, create_engine, Session, select, text
from app.core.config import settings
from app.models import users, voice_actor, tts, ment  # 모든 모델 import

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database_tables():
    """데이터베이스 테이블 상태 확인"""
    print("🔍 데이터베이스 테이블 상태 확인...")
    
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    
    with Session(engine) as session:
        try:
            # 테이블 목록 조회
            result = session.exec(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            
            tables = result.fetchall()
            print(f"✅ 현재 데이터베이스 테이블 ({len(tables)}개):")
            for table in tables:
                print(f"  - {table[0]}")
            
            # 각 테이블의 레코드 수 확인
            print("\n📊 테이블별 레코드 수:")
            
            table_names = [
                "user", "voiceactor", "voicemodel", "voicesample", 
                "ttsscript", "ttsgeneration", "ttslibrary", "ment"
            ]
            
            for table_name in table_names:
                try:
                    result = session.exec(text(f"SELECT COUNT(*) FROM {table_name}"))
                    count = result.fetchone()
                    print(f"  - {table_name}: {count[0] if count else 0}개")
                except Exception as e:
                    print(f"  - {table_name}: ❌ 테이블이 존재하지 않거나 오류 ({e})")
            
            # VoiceModel 테이블 스키마 확인
            print("\n🔍 VoiceModel 테이블 스키마:")
            try:
                result = session.exec(text("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'voicemodel'
                    ORDER BY ordinal_position;
                """))
                
                columns = result.fetchall()
                for col in columns:
                    print(f"  - {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
                    
            except Exception as e:
                print(f"❌ VoiceModel 테이블 스키마 조회 실패: {e}")
                
        except Exception as e:
            print(f"❌ 데이터베이스 연결 또는 조회 실패: {e}")

def create_sample_data():
    """샘플 데이터 생성"""
    print("\n🎭 샘플 데이터 생성...")
    
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    
    with Session(engine) as session:
        try:
            # 사용자 확인
            from app.models.users import User
            user_result = session.exec(select(User).where(User.email == settings.FIRST_SUPERUSER))
            user = user_result.first()
            
            if not user:
                print("❌ 슈퍼유저가 없습니다. 먼저 슈퍼유저를 생성해주세요.")
                return
                
            print(f"✅ 사용자 확인: {user.email}")
            
            # 성우 생성
            from app.models.voice_actor import VoiceActor, GenderType, AgeRangeType
            
            # 기존 성우 확인
            existing_actor = session.exec(select(VoiceActor).where(VoiceActor.name == "김소연")).first()
            
            if not existing_actor:
                sample_actor = VoiceActor(
                    name="김소연",
                    gender=GenderType.FEMALE,
                    age_range=AgeRangeType.THIRTIES,
                    language="ko",
                    description="친근하고 따뜻한 목소리의 전문 성우",
                    characteristics={
                        "tone": "친근함",
                        "style": "밝음",
                        "specialty": "보험업계"
                    },
                    created_by=user.id
                )
                
                session.add(sample_actor)
                session.commit()
                session.refresh(sample_actor)
                print(f"✅ 샘플 성우 생성: {sample_actor.name} (ID: {sample_actor.id})")
            else:
                sample_actor = existing_actor
                print(f"✅ 기존 성우 사용: {sample_actor.name} (ID: {sample_actor.id})")
            
            # 음성 모델 생성
            from app.models.voice_actor import VoiceModel, ModelStatus
            
            existing_model = session.exec(
                select(VoiceModel).where(VoiceModel.voice_actor_id == sample_actor.id)
            ).first()
            
            if not existing_model:
                sample_model = VoiceModel(
                    voice_actor_id=sample_actor.id,
                    model_name=f"{sample_actor.name}_v1.0",
                    model_path=f"voice_models/{sample_actor.id}/model_v1.pth",
                    model_version="1.0",
                    status=ModelStatus.READY,
                    quality_score=94.5,
                    training_data_duration=300
                )
                
                session.add(sample_model)
                session.commit()
                session.refresh(sample_model)
                print(f"✅ 샘플 음성 모델 생성: {sample_model.model_name} (ID: {sample_model.id})")
            else:
                print(f"✅ 기존 음성 모델 사용: {existing_model.model_name} (ID: {existing_model.id})")
                
        except Exception as e:
            logger.error(f"샘플 데이터 생성 실패: {e}")
            session.rollback()

def init_database():
    """데이터베이스 초기화"""
    print("🚀 데이터베이스 초기화...")
    
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    
    try:
        # 모든 테이블 생성
        SQLModel.metadata.create_all(engine)
        print("✅ 데이터베이스 테이블 생성 완료")
        
    except Exception as e:
        print(f"❌ 데이터베이스 초기화 실패: {e}")

def main():
    print("🔧 데이터베이스 진단 및 초기화 도구")
    print("=" * 50)
    
    # 1. 현재 테이블 상태 확인
    check_database_tables()
    
    # 2. 테이블 생성 (필요한 경우)
    init_database()
    
    # 3. 다시 테이블 상태 확인
    print("\n" + "=" * 30)
    check_database_tables()
    
    # 4. 샘플 데이터 생성
    create_sample_data()
    
    print("\n" + "=" * 50)
    print("✅ 데이터베이스 진단 완료")

if __name__ == "__main__":
    main()
