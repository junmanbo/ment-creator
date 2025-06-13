"""
TTS 엔진 관리 및 전환을 위한 API 엔드포인트
"""

import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends

from app.api.deps import CurrentUser, SessionDep
from app.services.tts_factory import (
    tts_factory, 
    TTSEngine, 
    get_tts_service, 
    switch_tts_engine, 
    get_current_tts_engine
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tts-engines", tags=["tts-engines"])

@router.get("/")
def get_tts_engines():
    """지원되는 TTS 엔진 목록 조회"""
    return {
        "supported_engines": [
            {
                "name": TTSEngine.COQUI,
                "display_name": "Coqui TTS",
                "description": "XTTS v2 기반 Voice Cloning TTS",
                "features": ["voice_cloning", "multilingual", "open_source"],
                "performance": "medium",
                "quality": "good"
            },
            {
                "name": TTSEngine.FISH_SPEECH,
                "display_name": "Fish Speech",
                "description": "SOTA 오픈소스 TTS with 한국어 최적화",
                "features": ["voice_cloning", "multilingual", "high_quality", "fast"],
                "performance": "high", 
                "quality": "excellent"
            }
        ],
        "current_engine": get_current_tts_engine(),
        "default_engine": tts_factory.default_engine
    }

@router.get("/current")
def get_current_engine():
    """현재 사용 중인 TTS 엔진 조회"""
    current = get_current_tts_engine()
    return {
        "current_engine": current,
        "engine_info": {
            "name": current.value if current else None,
            "display_name": "Fish Speech" if current == TTSEngine.FISH_SPEECH else "Coqui TTS" if current == TTSEngine.COQUI else None,
            "status": "active" if current else "not_initialized"
        }
    }

@router.post("/switch/{engine}")
async def switch_engine(
    *,
    engine: TTSEngine,
    current_user: CurrentUser
):
    """TTS 엔진 전환"""
    logger.info(f"🔄 TTS 엔진 전환 요청: {get_current_tts_engine()} → {engine} (사용자: {current_user.id})")
    
    try:
        # 엔진 전환
        new_service = switch_tts_engine(engine)
        
        # 전환 후 상태 확인
        await new_service.initialize_tts_model()
        
        logger.info(f"✅ TTS 엔진 전환 완료: {engine}")
        
        return {
            "message": f"TTS 엔진이 {engine.value}로 전환되었습니다",
            "previous_engine": get_current_tts_engine(),
            "current_engine": engine,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ TTS 엔진 전환 실패: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"TTS 엔진 전환 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/test/{engine}")
async def test_engine(
    *,
    engine: TTSEngine,
    current_user: CurrentUser
):
    """특정 TTS 엔진 테스트"""
    logger.info(f"🧪 TTS 엔진 테스트: {engine} (사용자: {current_user.id})")
    
    try:
        test_result = await tts_factory.test_engine(engine)
        
        return {
            "message": f"{engine.value} 엔진 테스트 완료",
            "test_result": test_result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ TTS 엔진 테스트 실패 ({engine}): {e}")
        raise HTTPException(
            status_code=500,
            detail=f"TTS 엔진 테스트 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/benchmark")
async def benchmark_engines(
    *,
    current_user: CurrentUser
):
    """모든 TTS 엔진 성능 비교"""
    logger.info(f"⚡ TTS 엔진 벤치마크 시작 (사용자: {current_user.id})")
    
    try:
        benchmark_results = await tts_factory.benchmark_engines()
        
        logger.info(f"✅ TTS 엔진 벤치마크 완료. 추천 엔진: {benchmark_results.get('recommendation', {}).get('best_engine')}")
        
        return {
            "message": "TTS 엔진 성능 비교 완료",
            "benchmark_results": benchmark_results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ TTS 엔진 벤치마크 실패: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"TTS 엔진 벤치마크 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/status")
async def get_engines_status(
    *,
    current_user: CurrentUser
):
    """모든 TTS 엔진 상태 조회"""
    logger.info(f"📊 TTS 엔진 상태 조회 (사용자: {current_user.id})")
    
    try:
        status_results = {}
        
        for engine in tts_factory.get_supported_engines():
            try:
                service = tts_factory.get_tts_service(engine)
                # 빠른 상태 확인 (초기화 없이)
                if hasattr(service, 'model_loaded'):
                    status_results[engine.value] = {
                        "available": True,
                        "initialized": service.model_loaded,
                        "description": "Fish Speech TTS" if engine == TTSEngine.FISH_SPEECH else "Coqui TTS"
                    }
                else:
                    status_results[engine.value] = {
                        "available": True,
                        "initialized": False,
                        "description": "Fish Speech TTS" if engine == TTSEngine.FISH_SPEECH else "Coqui TTS"
                    }
            except Exception as e:
                status_results[engine.value] = {
                    "available": False,
                    "error": str(e),
                    "description": "Fish Speech TTS" if engine == TTSEngine.FISH_SPEECH else "Coqui TTS"
                }
        
        return {
            "engines": status_results,
            "current_engine": get_current_tts_engine(),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ TTS 엔진 상태 조회 실패: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"TTS 엔진 상태 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/quick-test")
async def quick_test_current_engine(
    *,
    current_user: CurrentUser,
    test_text: str = "안녕하세요. 이것은 빠른 TTS 테스트입니다."
):
    """현재 엔진으로 빠른 TTS 테스트"""
    logger.info(f"⚡ 빠른 TTS 테스트 (사용자: {current_user.id})")
    
    try:
        current_service = get_tts_service()
        test_result = await current_service.test_tts_functionality()
        
        return {
            "message": "빠른 TTS 테스트 완료",
            "engine": get_current_tts_engine(),
            "test_result": test_result,
            "test_text": test_text,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ 빠른 TTS 테스트 실패: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"빠른 TTS 테스트 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/recommendations")
def get_engine_recommendations():
    """TTS 엔진 추천 정보"""
    return {
        "recommendations": [
            {
                "engine": TTSEngine.FISH_SPEECH,
                "title": "🐟 Fish Speech (추천)",
                "pros": [
                    "최고 품질의 한국어 TTS",
                    "빠른 생성 속도 (1:7 실시간 비율)",
                    "뛰어난 Voice Cloning 성능",
                    "10-30초 샘플로 음성 복제",
                    "최신 SOTA 모델"
                ],
                "cons": [
                    "설치 과정이 복잡할 수 있음",
                    "GPU 메모리 사용량이 높음"
                ],
                "use_cases": [
                    "고품질 음성이 필요한 프로덕션 환경",
                    "빠른 TTS 생성이 중요한 경우",
                    "한국어 TTS 품질이 중요한 프로젝트"
                ]
            },
            {
                "engine": TTSEngine.COQUI,
                "title": "🎙️ Coqui TTS",
                "pros": [
                    "안정적이고 검증된 솔루션",
                    "상대적으로 설정이 간단",
                    "다양한 언어 지원",
                    "오픈소스 생태계"
                ],
                "cons": [
                    "Fish Speech보다 품질이 낮음",
                    "생성 속도가 상대적으로 느림",
                    "PyTorch 호환성 문제"
                ],
                "use_cases": [
                    "테스트 및 개발 환경",
                    "기본적인 TTS 기능이 필요한 경우",
                    "안정성이 우선인 프로젝트"
                ]
            }
        ],
        "quick_decision": {
            "for_production": TTSEngine.FISH_SPEECH,
            "for_development": TTSEngine.COQUI,
            "for_korean_quality": TTSEngine.FISH_SPEECH,
            "for_stability": TTSEngine.COQUI
        }
    }
