#!/usr/bin/env python3
"""
백엔드 서버 상태 확인 및 voice models API 테스트 스크립트
"""

import asyncio
import sys
import os
import logging
from pathlib import Path

# 백엔드 경로를 Python path에 추가
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_voice_models_api():
    """Voice Models API 테스트"""
    try:
        # 환경변수 확인
        logger.info("🔧 환경변수 확인...")
        database_url = os.getenv("DATABASE_URL", "Not found")
        logger.info(f"DATABASE_URL: {database_url}")
        
        # 데이터베이스 연결 테스트
        logger.info("🗄️ 데이터베이스 연결 테스트...")
        from app.core.db import engine
        from sqlmodel import SQLModel
        
        # 테이블 생성 (개발용)
        logger.info("📋 데이터베이스 테이블 생성...")
        SQLModel.metadata.create_all(engine)
        
        # 세션 테스트
        logger.info("🔄 데이터베이스 세션 테스트...")
        from app.core.db import get_session
        from app.models.voice_actor import VoiceModel
        from sqlmodel import select
        
        with get_session() as session:
            # VoiceModel 개수 확인
            statement = select(VoiceModel)
            result = session.exec(statement)
            models = result.all()
            logger.info(f"📊 데이터베이스에 {len(models)} 개의 VoiceModel 발견")
            
            # 첫 번째 모델 정보 출력
            if models:
                first_model = models[0]
                logger.info(f"🎯 첫 번째 모델: {first_model.model_name} (status: {first_model.status})")
                logger.info(f"🔗 Voice Actor ID: {first_model.voice_actor_id}")
                logger.info(f"📅 생성일: {first_model.created_at}")
                
                # VoiceModelPublic으로 변환 테스트
                logger.info("🔄 VoiceModelPublic 변환 테스트...")
                from app.models.voice_actor import VoiceModelPublic
                
                try:
                    public_model = VoiceModelPublic.model_validate(first_model)
                    logger.info(f"✅ VoiceModelPublic 변환 성공: {public_model.model_name}")
                except Exception as e:
                    logger.error(f"❌ VoiceModelPublic 변환 실패: {e}")
                    logger.error(f"모델 데이터: {first_model.__dict__}")
            else:
                logger.warning("⚠️ 데이터베이스에 VoiceModel이 없습니다.")
                
                # 테스트 데이터 생성
                logger.info("🏗️ 테스트 VoiceModel 생성...")
                from app.models.voice_actor import VoiceActor, VoiceModel, ModelStatus
                import uuid
                from datetime import datetime
                
                # 테스트 성우 생성
                test_actor = VoiceActor(
                    name="테스트 성우",
                    gender="female",
                    age_range="30s",
                    created_by=uuid.uuid4()  # 임시 사용자 ID
                )
                session.add(test_actor)
                session.commit()
                session.refresh(test_actor)
                
                # 테스트 모델 생성
                test_model = VoiceModel(
                    voice_actor_id=test_actor.id,
                    model_name="테스트 모델",
                    model_path="/tmp/test_model.pth",
                    status=ModelStatus.READY
                )
                session.add(test_model)
                session.commit()
                session.refresh(test_model)
                
                logger.info(f"✅ 테스트 모델 생성 완료: {test_model.id}")
        
        logger.info("🎉 모든 테스트 완료!")
        return True
        
    except Exception as e:
        logger.error(f"💥 테스트 실패: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    success = asyncio.run(test_voice_models_api())
    sys.exit(0 if success else 1)
