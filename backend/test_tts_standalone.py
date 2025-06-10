#!/usr/bin/env python3
"""
TTS 환경 진단 및 테스트 스크립트
실제 TTS 에러의 원인을 파악하기 위한 독립적인 테스트
"""

import sys
import os
import asyncio
import logging
from pathlib import Path

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_basic_imports():
    """기본 라이브러리 import 테스트"""
    logger.info("=== 기본 라이브러리 Import 테스트 ===")
    
    test_results = {}
    
    # PyTorch 테스트
    try:
        import torch
        test_results['torch'] = {
            'success': True,
            'version': torch.__version__,
            'cuda_available': torch.cuda.is_available(),
            'device_count': torch.cuda.device_count() if torch.cuda.is_available() else 0
        }
        logger.info(f"✅ PyTorch {torch.__version__} - CUDA: {torch.cuda.is_available()}")
        
        if torch.cuda.is_available():
            for i in range(torch.cuda.device_count()):
                gpu_name = torch.cuda.get_device_name(i)
                logger.info(f"   GPU {i}: {gpu_name}")
    except ImportError as e:
        test_results['torch'] = {'success': False, 'error': str(e)}
        logger.error(f"❌ PyTorch import 실패: {e}")
    
    # TorchAudio 테스트
    try:
        import torchaudio
        test_results['torchaudio'] = {
            'success': True,
            'version': torchaudio.__version__
        }
        logger.info(f"✅ TorchAudio {torchaudio.__version__}")
    except ImportError as e:
        test_results['torchaudio'] = {'success': False, 'error': str(e)}
        logger.error(f"❌ TorchAudio import 실패: {e}")
    
    # TTS 라이브러리 테스트
    try:
        import TTS
        test_results['TTS'] = {
            'success': True,
            'version': getattr(TTS, '__version__', 'unknown')
        }
        logger.info(f"✅ TTS 라이브러리 {getattr(TTS, '__version__', 'unknown')}")
    except ImportError as e:
        test_results['TTS'] = {'success': False, 'error': str(e)}
        logger.error(f"❌ TTS 라이브러리 import 실패: {e}")
        return test_results
    
    # Librosa 테스트
    try:
        import librosa
        test_results['librosa'] = {
            'success': True,
            'version': librosa.__version__
        }
        logger.info(f"✅ Librosa {librosa.__version__}")
    except ImportError as e:
        test_results['librosa'] = {'success': False, 'error': str(e)}
        logger.warning(f"⚠️ Librosa import 실패 (선택사항): {e}")
    
    # SoundFile 테스트
    try:
        import soundfile
        test_results['soundfile'] = {
            'success': True,
            'version': soundfile.__version__
        }
        logger.info(f"✅ SoundFile {soundfile.__version__}")
    except ImportError as e:
        test_results['soundfile'] = {'success': False, 'error': str(e)}
        logger.warning(f"⚠️ SoundFile import 실패 (선택사항): {e}")
    
    return test_results

async def test_tts_model_loading():
    """TTS 모델 로딩 테스트"""
    logger.info("\n=== TTS 모델 로딩 테스트 ===")
    
    try:
        from TTS.api import TTS
        
        model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
        logger.info(f"TTS 모델 로딩 시도: {model_name}")
        logger.info("⚠️ 최초 로딩 시 모델 다운로드로 시간이 걸릴 수 있습니다...")
        
        # GPU 사용 여부 결정
        import torch
        use_gpu = torch.cuda.is_available()
        logger.info(f"GPU 사용: {use_gpu}")
        
        # 모델 로딩 시도
        def load_model():
            return TTS(model_name, gpu=use_gpu)
        
        # 비동기 실행으로 타임아웃 설정
        loop = asyncio.get_event_loop()
        tts = await asyncio.wait_for(
            loop.run_in_executor(None, load_model),
            timeout=300  # 5분 타임아웃
        )
        
        logger.info("✅ TTS 모델 로딩 성공!")
        
        # 간단한 TTS 생성 테스트
        await test_tts_generation(tts, use_gpu)
        
        return True
        
    except asyncio.TimeoutError:
        logger.error("❌ TTS 모델 로딩 타임아웃 (5분)")
        return False
    except Exception as e:
        logger.error(f"❌ TTS 모델 로딩 실패: {type(e).__name__}: {e}")
        return False

async def test_tts_generation(tts_model, use_gpu):
    """실제 TTS 생성 테스트"""
    logger.info("\n=== TTS 생성 테스트 ===")
    
    test_text = "안녕하세요. 이것은 TTS 테스트입니다."
    output_file = "test_tts_output.wav"
    
    try:
        # 출력 파일 경로 설정
        output_path = Path(output_file)
        if output_path.exists():
            output_path.unlink()  # 기존 파일 삭제
        
        logger.info(f"텍스트: {test_text}")
        logger.info(f"출력 파일: {output_path}")
        
        # TTS 생성 함수
        def generate_tts():
            tts_model.tts_to_file(
                text=test_text,
                file_path=str(output_path),
                language="ko",
                split_sentences=True
            )
        
        # 비동기 실행
        loop = asyncio.get_event_loop()
        await asyncio.wait_for(
            loop.run_in_executor(None, generate_tts),
            timeout=60  # 1분 타임아웃
        )
        
        # 결과 확인
        if output_path.exists():
            file_size = output_path.stat().st_size
            logger.info(f"✅ TTS 생성 성공!")
            logger.info(f"   파일 크기: {file_size:,} bytes")
            
            # 오디오 길이 계산 시도
            try:
                import wave
                with wave.open(str(output_path), 'rb') as wav_file:
                    frames = wav_file.getnframes()
                    sample_rate = wav_file.getframerate()
                    duration = frames / sample_rate
                    logger.info(f"   오디오 길이: {duration:.2f}초")
            except Exception as e:
                logger.warning(f"   오디오 길이 계산 실패: {e}")
            
            # 테스트 파일 정리
            output_path.unlink()
            
            return True
        else:
            logger.error("❌ TTS 파일이 생성되지 않았습니다")
            return False
            
    except asyncio.TimeoutError:
        logger.error("❌ TTS 생성 타임아웃 (1분)")
        return False
    except Exception as e:
        logger.error(f"❌ TTS 생성 실패: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"상세 오류:\n{traceback.format_exc()}")
        return False

async def test_directory_structure():
    """디렉토리 구조 테스트"""
    logger.info("\n=== 디렉토리 구조 테스트 ===")
    
    directories = ["audio_files", "voice_samples"]
    
    for dir_name in directories:
        dir_path = Path(dir_name)
        
        if not dir_path.exists():
            logger.info(f"📁 {dir_name} 디렉토리 생성")
            dir_path.mkdir(parents=True, exist_ok=True)
        
        if dir_path.exists():
            is_writable = os.access(dir_path, os.W_OK)
            file_count = len(list(dir_path.iterdir()))
            logger.info(f"✅ {dir_name}: 존재={True}, 쓰기가능={is_writable}, 파일수={file_count}")
        else:
            logger.error(f"❌ {dir_name} 디렉토리 생성 실패")

async def main():
    """메인 테스트 실행"""
    logger.info("🚀 TTS 환경 진단 및 테스트 시작")
    logger.info(f"Python 버전: {sys.version}")
    logger.info(f"작업 디렉토리: {Path.cwd()}")
    
    # 1. 기본 라이브러리 테스트
    import_results = await test_basic_imports()
    
    # 필수 라이브러리 확인
    if not import_results.get('torch', {}).get('success'):
        logger.error("❌ PyTorch가 설치되지 않았습니다. TTS를 사용할 수 없습니다.")
        return False
    
    if not import_results.get('TTS', {}).get('success'):
        logger.error("❌ TTS 라이브러리가 설치되지 않았습니다.")
        logger.error("설치 방법: pip install TTS 또는 uv add TTS")
        return False
    
    # 2. 디렉토리 구조 테스트
    await test_directory_structure()
    
    # 3. TTS 모델 로딩 및 생성 테스트
    tts_success = await test_tts_model_loading()
    
    # 최종 결과
    logger.info("\n=== 테스트 결과 요약 ===")
    if tts_success:
        logger.info("✅ 모든 TTS 테스트가 성공했습니다!")
        logger.info("   실제 TTS 음성 생성이 정상적으로 동작합니다.")
    else:
        logger.error("❌ TTS 테스트가 실패했습니다.")
        logger.error("   위의 에러 메시지를 확인하여 문제를 해결해주세요.")
    
    return tts_success

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("사용자에 의해 테스트가 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"예상치 못한 오류: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)
