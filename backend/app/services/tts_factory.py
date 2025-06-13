"""
TTS 서비스 팩토리
Coqui TTS와 Fish Speech 간 쉬운 전환을 위한 팩토리 패턴
"""

import os
import logging
from typing import Union, Optional
from enum import Enum

from app.services.tts_service import TTSService
from app.services.fish_speech_tts_service import FishSpeechTTSService

logger = logging.getLogger(__name__)

class TTSEngine(str, Enum):
    """지원되는 TTS 엔진"""
    COQUI = "coqui"
    FISH_SPEECH = "fish_speech"

class TTSServiceFactory:
    """TTS 서비스 팩토리"""
    
    _instance = None
    _current_service = None
    _current_engine = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        # 환경변수에서 기본 TTS 엔진 설정 (기본값: Fish Speech)
        self.default_engine = TTSEngine(
            os.getenv("TTS_ENGINE", TTSEngine.FISH_SPEECH)
        )
        logger.info(f"기본 TTS 엔진: {self.default_engine}")
    
    def get_tts_service(
        self, 
        engine: Optional[TTSEngine] = None
    ) -> Union[TTSService, FishSpeechTTSService]:
        """
        TTS 서비스 인스턴스 반환
        
        Args:
            engine: 사용할 TTS 엔진 (None이면 기본 엔진 사용)
            
        Returns:
            TTS 서비스 인스턴스
        """
        target_engine = engine or self.default_engine
        
        # 현재 서비스가 요청된 엔진과 같으면 재사용
        if self._current_service and self._current_engine == target_engine:
            return self._current_service
        
        # 새 서비스 생성
        logger.info(f"TTS 서비스 생성: {target_engine}")
        
        if target_engine == TTSEngine.COQUI:
            self._current_service = TTSService()
            logger.info("✅ Coqui TTS 서비스 로드")
        elif target_engine == TTSEngine.FISH_SPEECH:
            self._current_service = FishSpeechTTSService()
            logger.info("🐟 Fish Speech TTS 서비스 로드")
        else:
            raise ValueError(f"지원되지 않는 TTS 엔진: {target_engine}")
        
        self._current_engine = target_engine
        return self._current_service
    
    def switch_engine(self, engine: TTSEngine):
        """TTS 엔진 전환"""
        logger.info(f"TTS 엔진 전환: {self._current_engine} → {engine}")
        
        # 기존 서비스 정리
        if self._current_service:
            if hasattr(self._current_service, '__del__'):
                try:
                    self._current_service.__del__()
                except:
                    pass
        
        # 새 서비스 로드
        self._current_service = None
        self._current_engine = None
        
        return self.get_tts_service(engine)
    
    def get_current_engine(self) -> Optional[TTSEngine]:
        """현재 사용 중인 TTS 엔진 반환"""
        return self._current_engine
    
    def get_supported_engines(self) -> list[TTSEngine]:
        """지원되는 TTS 엔진 목록"""
        return list(TTSEngine)
    
    async def test_engine(self, engine: TTSEngine) -> dict:
        """특정 TTS 엔진 테스트"""
        logger.info(f"TTS 엔진 테스트: {engine}")
        
        try:
            service = self.get_tts_service(engine)
            result = await service.test_tts_functionality()
            result["engine"] = engine.value
            return result
        except Exception as e:
            logger.error(f"TTS 엔진 테스트 실패 ({engine}): {e}")
            return {
                "success": False,
                "engine": engine.value,
                "error": str(e)
            }
    
    async def benchmark_engines(self) -> dict:
        """모든 TTS 엔진 성능 비교"""
        logger.info("TTS 엔진 성능 비교 시작")
        
        results = {}
        
        for engine in self.get_supported_engines():
            logger.info(f"벤치마크 실행: {engine}")
            
            try:
                import time
                start_time = time.time()
                
                test_result = await self.test_engine(engine)
                
                end_time = time.time()
                generation_time = end_time - start_time
                
                results[engine.value] = {
                    **test_result,
                    "generation_time": generation_time,
                    "performance_score": self._calculate_performance_score(
                        test_result, generation_time
                    )
                }
                
            except Exception as e:
                results[engine.value] = {
                    "success": False,
                    "error": str(e),
                    "generation_time": None,
                    "performance_score": 0
                }
        
        # 최고 성능 엔진 추천
        best_engine = max(
            results.keys(),
            key=lambda x: results[x].get("performance_score", 0)
        )
        
        results["recommendation"] = {
            "best_engine": best_engine,
            "reason": self._get_recommendation_reason(results[best_engine])
        }
        
        logger.info(f"성능 비교 완료. 추천 엔진: {best_engine}")
        return results
    
    def _calculate_performance_score(self, test_result: dict, generation_time: float) -> float:
        """성능 점수 계산"""
        if not test_result.get("success", False):
            return 0.0
        
        base_score = 50.0
        
        # 생성 시간 점수 (빠를수록 높음)
        if generation_time:
            if generation_time < 5:
                time_score = 30
            elif generation_time < 10:
                time_score = 20
            elif generation_time < 20:
                time_score = 10
            else:
                time_score = 5
        else:
            time_score = 0
        
        # 품질 점수
        quality_score = test_result.get("quality_estimated", 85) * 0.2
        
        return min(100.0, base_score + time_score + quality_score)
    
    def _get_recommendation_reason(self, result: dict) -> str:
        """추천 이유 생성"""
        if not result.get("success", False):
            return "사용 불가"
        
        performance_score = result.get("performance_score", 0)
        generation_time = result.get("generation_time", 0)
        
        if performance_score > 90:
            return f"최고 성능 ({performance_score:.1f}점, {generation_time:.1f}초)"
        elif performance_score > 80:
            return f"우수한 성능 ({performance_score:.1f}점, {generation_time:.1f}초)"
        elif performance_score > 70:
            return f"양호한 성능 ({performance_score:.1f}점, {generation_time:.1f}초)"
        else:
            return f"기본 성능 ({performance_score:.1f}점, {generation_time:.1f}초)"

# 글로벌 TTS 서비스 팩토리 인스턴스
tts_factory = TTSServiceFactory()

# 편의를 위한 함수들
def get_tts_service(engine: Optional[TTSEngine] = None):
    """현재 설정된 TTS 서비스 반환"""
    return tts_factory.get_tts_service(engine)

def switch_tts_engine(engine: TTSEngine):
    """TTS 엔진 전환"""
    return tts_factory.switch_engine(engine)

def get_current_tts_engine() -> Optional[TTSEngine]:
    """현재 TTS 엔진 반환"""
    return tts_factory.get_current_engine()

# 호환성을 위해 기본 TTS 서비스 인스턴스도 제공
tts_service = get_tts_service()
