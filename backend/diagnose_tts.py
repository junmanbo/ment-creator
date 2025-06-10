#!/usr/bin/env python3
"""
TTS 문제 진단 스크립트
실제 TTS 모델 로딩 상태와 Mock TTS 문제를 확인
"""

import asyncio
import sys
import os
import logging
from pathlib import Path

# 백엔드 모듈을 import하기 위해 경로 추가
sys.path.append(str(Path(__file__).parent))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def diagnose_tts_system():
    """TTS 시스템 진단"""
    logger.info("🔍 TTS 시스템 진단 시작")
    logger.info("=" * 50)
    
    # 1. 기본 라이브러리 확인
    logger.info("1. 기본 라이브러리 확인")
    try:
        import torch
        logger.info(f"   ✅ PyTorch: {torch.__version__}")
        logger.info(f"   ✅ CUDA 사용 가능: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            logger.info(f"   ✅ GPU 개수: {torch.cuda.device_count()}")
    except ImportError:
        logger.error("   ❌ PyTorch 없음")
    
    try:
        from TTS.api import TTS
        logger.info("   ✅ Coqui TTS 라이브러리 사용 가능")
    except ImportError as e:
        logger.error(f"   ❌ Coqui TTS 없음: {e}")
        return False
    
    # 2. TTS 서비스 초기화 테스트
    logger.info("\n2. TTS 서비스 초기화 테스트")
    try:
        from app.services.tts_service import tts_service
        
        # 모델 초기화
        await tts_service.initialize_tts_model()
        
        if tts_service.tts_model == "mock":
            logger.warning("   ⚠️ Mock TTS 모드로 동작 중")
            return await test_mock_improvement()
        else:
            logger.info("   ✅ 실제 TTS 모델 로드 성공")
            return await test_real_tts()
            
    except Exception as e:
        logger.error(f"   ❌ TTS 서비스 초기화 실패: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

async def test_real_tts():
    """실제 TTS 모델 테스트"""
    logger.info("\n3. 실제 TTS 모델 테스트")
    
    try:
        from app.services.tts_service import tts_service
        
        test_text = "안녕하세요. 이것은 실제 TTS 음성 생성 테스트입니다."
        output_path = "audio_files/real_tts_test.wav"
        
        logger.info(f"   텍스트: {test_text}")
        logger.info("   실제 TTS 생성 중...")
        
        # 직접 TTS 생성 테스트
        result = await tts_service._generate_tts_audio(
            text=test_text,
            voice_actor=None,
            generation_params={},
            session=None
        )
        
        if Path(result).exists():
            file_size = Path(result).stat().st_size
            logger.info(f"   ✅ 실제 TTS 생성 성공: {file_size:,} bytes")
            return True
        else:
            logger.error("   ❌ TTS 파일 생성 실패")
            return False
            
    except Exception as e:
        logger.error(f"   ❌ 실제 TTS 테스트 실패: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

async def test_mock_improvement():
    """Mock TTS 개선 테스트"""
    logger.info("\n3. Mock TTS 개선 테스트")
    
    try:
        from app.services.tts_service import tts_service
        
        test_text = "안녕하세요. 개선된 Mock TTS 테스트입니다. 더 자연스러운 음성으로 생성됩니다."
        output_path = "audio_files/improved_mock_test.wav"
        
        logger.info(f"   텍스트: {test_text}")
        logger.info("   개선된 Mock TTS 생성 중...")
        
        await tts_service._create_mock_audio(output_path, test_text)
        
        if Path(output_path).exists():
            file_size = Path(output_path).stat().st_size
            
            # WAV 파일 분석
            try:
                import wave
                with wave.open(output_path, 'rb') as wav_file:
                    frames = wav_file.getnframes()
                    sample_rate = wav_file.getframerate()
                    duration = frames / sample_rate
                    
                logger.info(f"   ✅ 개선된 Mock TTS 생성 성공")
                logger.info(f"   📊 파일 크기: {file_size:,} bytes")
                logger.info(f"   📊 길이: {duration:.2f}초")
                logger.info(f"   📊 샘플링 레이트: {sample_rate} Hz")
                
                return True
                
            except Exception as e:
                logger.warning(f"   WAV 분석 실패: {e}")
                return True  # 파일은 생성됨
        else:
            logger.error("   ❌ Mock TTS 파일 생성 실패")
            return False
            
    except Exception as e:
        logger.error(f"   ❌ Mock TTS 테스트 실패: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

async def main():
    """메인 진단 실행"""
    os.chdir(Path(__file__).parent)
    
    success = await diagnose_tts_system()
    
    if success:
        logger.info("\n✅ TTS 시스템 진단 완료")
    else:
        logger.error("\n❌ TTS 시스템에 문제가 있습니다")
        
        logger.info("\n🔧 해결 방안:")
        logger.info("1. TTS 라이브러리 설치: pip install TTS torch torchaudio")
        logger.info("2. GPU 드라이버 업데이트 (GPU 사용 시)")
        logger.info("3. 충분한 메모리 확보 (모델 로딩용)")

if __name__ == "__main__":
    asyncio.run(main())
