#!/usr/bin/env python3
"""
TTS 설정 및 의존성 테스트 스크립트
Voice Model 생성 문제 진단용
"""

import sys
import os
import subprocess
import traceback
from pathlib import Path

def test_basic_imports():
    """기본 라이브러리 import 테스트"""
    print("=== 기본 라이브러리 Import 테스트 ===")
    
    # 필수 라이브러리들
    libraries = [
        ("numpy", "import numpy as np"),
        ("torch", "import torch"),
        ("torchaudio", "import torchaudio"),
        ("librosa", "import librosa"),
        ("soundfile", "import soundfile"),
        ("TTS", "from TTS.api import TTS"),
    ]
    
    results = {}
    for lib_name, import_cmd in libraries:
        try:
            exec(import_cmd)
            print(f"✅ {lib_name}: OK")
            results[lib_name] = "OK"
        except ImportError as e:
            print(f"❌ {lib_name}: FAILED - {e}")
            results[lib_name] = str(e)
        except Exception as e:
            print(f"⚠️  {lib_name}: ERROR - {e}")
            results[lib_name] = str(e)
    
    return results

def test_gpu_availability():
    """GPU 사용 가능 여부 테스트"""
    print("\n=== GPU 사용 가능성 테스트 ===")
    
    try:
        import torch
        
        print(f"PyTorch version: {torch.__version__}")
        print(f"CUDA available: {torch.cuda.is_available()}")
        
        if torch.cuda.is_available():
            print(f"CUDA version: {torch.version.cuda}")
            print(f"GPU count: {torch.cuda.device_count()}")
            for i in range(torch.cuda.device_count()):
                print(f"GPU {i}: {torch.cuda.get_device_name(i)}")
        else:
            print("GPU를 사용할 수 없습니다. CPU 모드로 진행됩니다.")
            
    except Exception as e:
        print(f"GPU 테스트 중 오류: {e}")

def test_tts_model_loading():
    """TTS 모델 로딩 테스트"""
    print("\n=== TTS 모델 로딩 테스트 ===")
    
    try:
        from TTS.api import TTS
        import torch
        
        # GPU 사용 여부 결정
        use_gpu = torch.cuda.is_available()
        print(f"GPU 사용: {use_gpu}")
        
        print("XTTS v2 모델 로딩 중...")
        model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
        
        # 실제 모델 로딩 (시간이 오래 걸릴 수 있음)
        tts = TTS(model_name, gpu=use_gpu)
        print("✅ TTS 모델 로딩 성공!")
        
        # 간단한 TTS 테스트
        test_text = "안녕하세요. 테스트입니다."
        output_path = "/tmp/test_tts_output.wav"
        
        print("간단한 TTS 생성 테스트...")
        tts.tts_to_file(
            text=test_text,
            file_path=output_path,
            language="ko"
        )
        
        if Path(output_path).exists():
            file_size = Path(output_path).stat().st_size
            print(f"✅ TTS 생성 성공! 파일 크기: {file_size} bytes")
            # 테스트 파일 삭제
            Path(output_path).unlink()
        else:
            print("❌ TTS 파일이 생성되지 않았습니다.")
            
    except ImportError as e:
        print(f"❌ TTS 라이브러리 import 실패: {e}")
    except Exception as e:
        print(f"❌ TTS 모델 테스트 실패: {e}")
        print(f"오류 상세: {traceback.format_exc()}")

def test_voice_cloning():
    """Voice Cloning 기능 테스트"""
    print("\n=== Voice Cloning 기능 테스트 ===")
    
    try:
        from TTS.api import TTS
        import torch
        
        # 샘플 파일들 확인
        voice_samples_dir = Path("voice_samples")
        if not voice_samples_dir.exists():
            print("❌ voice_samples 디렉토리가 없습니다.")
            return
            
        sample_files = list(voice_samples_dir.rglob("*.wav"))
        print(f"발견된 음성 샘플: {len(sample_files)}개")
        
        if len(sample_files) == 0:
            print("❌ 테스트할 음성 샘플이 없습니다.")
            return
            
        # 첫 번째 샘플 파일 사용
        sample_file = sample_files[0]
        print(f"테스트 샘플: {sample_file}")
        
        # TTS 모델 로딩
        use_gpu = torch.cuda.is_available()
        model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
        tts = TTS(model_name, gpu=use_gpu)
        
        # Voice Cloning 테스트
        test_text = "안녕하세요. Voice Cloning 테스트입니다."
        output_path = "/tmp/test_voice_cloning.wav"
        
        print("Voice Cloning 테스트 중...")
        tts.tts_to_file(
            text=test_text,
            file_path=output_path,
            speaker_wav=[str(sample_file)],
            language="ko",
            split_sentences=True
        )
        
        if Path(output_path).exists():
            file_size = Path(output_path).stat().st_size
            print(f"✅ Voice Cloning 성공! 파일 크기: {file_size} bytes")
            # 테스트 파일 삭제
            Path(output_path).unlink()
        else:
            print("❌ Voice Cloning 파일이 생성되지 않았습니다.")
            
    except Exception as e:
        print(f"❌ Voice Cloning 테스트 실패: {e}")
        print(f"오류 상세: {traceback.format_exc()}")

def test_directory_structure():
    """디렉토리 구조 및 권한 테스트"""
    print("\n=== 디렉토리 구조 테스트 ===")
    
    directories = [
        "audio_files",
        "voice_samples", 
        "voice_models"
    ]
    
    for dir_name in directories:
        dir_path = Path(dir_name)
        if dir_path.exists():
            print(f"✅ {dir_name}: 존재함")
            # 권한 확인
            if os.access(dir_path, os.W_OK):
                print(f"   └─ 쓰기 권한: OK")
            else:
                print(f"   └─ 쓰기 권한: ❌ FAILED")
            
            # 내용 확인
            contents = list(dir_path.iterdir())
            print(f"   └─ 내용: {len(contents)}개 항목")
            
        else:
            print(f"❌ {dir_name}: 존재하지 않음")
            try:
                dir_path.mkdir(parents=True, exist_ok=True)
                print(f"   └─ 생성 완료: ✅")
            except Exception as e:
                print(f"   └─ 생성 실패: {e}")

def main():
    """메인 테스트 실행"""
    print("🔍 Voice Model 생성 문제 진단 스크립트")
    print("=" * 50)
    
    # 현재 작업 디렉토리 확인
    print(f"현재 디렉토리: {os.getcwd()}")
    print(f"Python 버전: {sys.version}")
    print(f"Python 경로: {sys.executable}")
    
    # 각 테스트 실행
    import_results = test_basic_imports()
    test_gpu_availability()
    test_directory_structure()
    
    # TTS 라이브러리가 정상적으로 import된 경우에만 실행
    if import_results.get("TTS") == "OK":
        test_tts_model_loading()
        test_voice_cloning()
    else:
        print("\n❌ TTS 라이브러리를 import할 수 없어 TTS 테스트를 건너뜁니다.")
        
        # 설치 제안
        print("\n📦 TTS 라이브러리 설치 방법:")
        print("pip install TTS torch torchaudio librosa soundfile")
        print("또는")
        print("uv add TTS torch torchaudio librosa soundfile")
    
    print("\n=== 진단 완료 ===")
    print("이 결과를 바탕으로 문제를 해결할 수 있습니다.")

if __name__ == "__main__":
    main()
