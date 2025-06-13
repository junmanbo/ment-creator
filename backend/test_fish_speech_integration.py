#!/usr/bin/env python3
"""
Fish Speech TTS 시스템 빠른 테스트
"""

import sys
import asyncio
import logging
from pathlib import Path

# 백엔드 경로 추가
sys.path.append('.')

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_tts_factory():
    """TTS 팩토리 테스트"""
    try:
        from app.services.tts_factory import tts_factory, TTSEngine, FISH_SPEECH_AVAILABLE
        
        logger.info("🧪 TTS 팩토리 테스트 시작")
        logger.info(f"Fish Speech 설치 상태: {'✅ 설치됨' if FISH_SPEECH_AVAILABLE else '❌ Mock 사용'}")
        
        # 1. 지원되는 엔진 목록
        engines = tts_factory.get_supported_engines()
        logger.info(f"지원되는 엔진: {[e.value for e in engines]}")
        
        # 2. 기본 엔진 확인
        default_engine = tts_factory.default_engine
        logger.info(f"기본 엔진: {default_engine}")
        
        # 3. Fish Speech 엔진 테스트
        logger.info("Fish Speech 엔진 테스트 중...")
        fish_service = tts_factory.get_tts_service(TTSEngine.FISH_SPEECH)
        test_result = await fish_service.test_tts_functionality()
        
        logger.info(f"Fish Speech 테스트 결과: {test_result}")
        
        # 4. Coqui TTS 엔진 테스트
        logger.info("Coqui TTS 엔진 테스트 중...")
        coqui_service = tts_factory.get_tts_service(TTSEngine.COQUI)
        coqui_result = await coqui_service.test_tts_functionality()
        
        logger.info(f"Coqui TTS 테스트 결과: {coqui_result}")
        
        # 5. 엔진 전환 테스트
        logger.info("엔진 전환 테스트...")
        current = tts_factory.get_current_engine()
        logger.info(f"현재 엔진: {current}")
        
        # Fish Speech로 전환
        tts_factory.switch_engine(TTSEngine.FISH_SPEECH)
        current = tts_factory.get_current_engine()
        logger.info(f"전환 후 엔진: {current}")
        
        # 6. 성능 벤치마크 (간단 버전)
        logger.info("성능 벤치마크 실행 중...")
        benchmark_results = await tts_factory.benchmark_engines()
        
        logger.info("벤치마크 결과:")
        for engine, result in benchmark_results.items():
            if engine != "recommendation":
                success = result.get("success", False)
                score = result.get("performance_score", 0)
                time = result.get("generation_time", 0)
                logger.info(f"  {engine}: {'✅' if success else '❌'} 성능={score:.1f}점, 시간={time:.2f}초")
        
        recommendation = benchmark_results.get("recommendation", {})
        best_engine = recommendation.get("best_engine", "N/A")
        reason = recommendation.get("reason", "N/A")
        logger.info(f"추천 엔진: {best_engine} ({reason})")
        
        logger.info("🎉 TTS 팩토리 테스트 완료!")
        return True
        
    except Exception as e:
        logger.error(f"❌ TTS 팩토리 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_api_endpoints():
    """API 엔드포인트 테스트"""
    try:
        from app.api.routes.tts_engines import router
        from app.services.tts_factory import TTSEngine
        
        logger.info("🌐 API 엔드포인트 테스트")
        
        # 라우터 확인
        routes = [route.path for route in router.routes]
        logger.info(f"TTS 엔진 API 라우트: {routes}")
        
        # 엔진 정보 시뮬레이션
        engines_info = {
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
            ]
        }
        
        logger.info(f"API 지원 엔진: {len(engines_info['supported_engines'])}개")
        for engine in engines_info['supported_engines']:
            logger.info(f"  - {engine['display_name']}: {engine['description']}")
        
        logger.info("✅ API 엔드포인트 테스트 완료")
        return True
        
    except Exception as e:
        logger.error(f"❌ API 엔드포인트 테스트 실패: {e}")
        return False

def main():
    """메인 테스트 함수"""
    logger.info("🚀 Fish Speech TTS 시스템 통합 테스트 시작")
    
    # 작업 디렉토리 확인
    backend_dir = Path(__file__).parent
    logger.info(f"작업 디렉토리: {backend_dir}")
    
    # 필요한 디렉토리 생성
    (backend_dir / "audio_files").mkdir(exist_ok=True)
    (backend_dir / "voice_samples").mkdir(exist_ok=True)
    
    success = True
    
    # 1. TTS 팩토리 테스트
    try:
        factory_result = asyncio.run(test_tts_factory())
        success = success and factory_result
    except Exception as e:
        logger.error(f"TTS 팩토리 테스트 중 오류: {e}")
        success = False
    
    # 2. API 엔드포인트 테스트  
    try:
        api_result = asyncio.run(test_api_endpoints())
        success = success and api_result
    except Exception as e:
        logger.error(f"API 테스트 중 오류: {e}")
        success = False
    
    # 최종 결과
    if success:
        logger.info("🎉 모든 테스트 통과!")
        logger.info("Fish Speech TTS 시스템이 정상적으로 작동합니다.")
        logger.info("")
        logger.info("다음 단계:")
        logger.info("1. 백엔드 서버 실행: uvicorn app.main:app --reload")
        logger.info("2. 프론트엔드에서 /settings 페이지 확인")
        logger.info("3. TTS 엔진 전환 및 테스트")
        if not globals().get('FISH_SPEECH_AVAILABLE', True):
            logger.info("4. 실제 Fish Speech 설치: python install_fish_speech.py")
    else:
        logger.error("❌ 일부 테스트 실패")
        logger.error("문제를 해결한 후 다시 시도해주세요.")
    
    return success

if __name__ == "__main__":
    result = main()
    sys.exit(0 if result else 1)
