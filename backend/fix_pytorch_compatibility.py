#!/usr/bin/env python3
"""
PyTorch 2.6+ 호환성 문제 해결 스크립트

이 스크립트는 PyTorch 2.6에서 발생하는 weights_only 관련 오류를 해결합니다.
"""

import sys
import subprocess
import importlib.util

def check_package_version(package_name):
    """패키지 버전 확인"""
    try:
        spec = importlib.util.find_spec(package_name)
        if spec is None:
            return None
        
        module = importlib.import_module(package_name)
        return getattr(module, '__version__', 'Unknown')
    except ImportError:
        return None

def run_command(command):
    """명령어 실행"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def main():
    print("🔧 TTS 호환성 문제 해결 스크립트")
    print("=" * 50)
    
    # 1. 현재 라이브러리 버전 확인
    torch_version = check_package_version('torch')
    torchaudio_version = check_package_version('torchaudio')
    tts_version = check_package_version('TTS')
    transformers_version = check_package_version('transformers')
    
    print(f"📦 현재 설치된 버전:")
    print(f"   - PyTorch: {torch_version or 'Not installed'}")
    print(f"   - TorchAudio: {torchaudio_version or 'Not installed'}")
    print(f"   - TTS: {tts_version or 'Not installed'}")
    print(f"   - Transformers: {transformers_version or 'Not installed'}")
    print()
    
    # 2. 호환성 문제 확인
    needs_fix = False
    issues = []
    
    # PyTorch 2.6+ 확인
    if torch_version:
        try:
            version_parts = torch_version.split('.')
            major = int(version_parts[0])
            minor = int(version_parts[1])
            
            if major > 2 or (major == 2 and minor >= 6):
                needs_fix = True
                issues.append("PyTorch 2.6+ 감지 - weights_only 문제 가능성")
            else:
                print("✅ PyTorch 버전 호환성 OK")
        except (ValueError, IndexError):
            print("❓ PyTorch 버전 파싱 실패")
    
    # Transformers 4.50+ 확인
    if transformers_version:
        try:
            version_parts = transformers_version.split('.')
            major = int(version_parts[0])
            minor = int(version_parts[1])
            
            if major > 4 or (major == 4 and minor >= 50):
                needs_fix = True
                issues.append("Transformers 4.50+ 감지 - GPT2InferenceModel.generate 메서드 제거됨")
            else:
                print("✅ Transformers 버전 호환성 OK")
        except (ValueError, IndexError):
            print("❓ Transformers 버전 파싱 실패")
    
    # 3. 문제 해결 방법 제시
    if needs_fix:
        print("\n⚠️  호환성 문제 발견:")
        for issue in issues:
            print(f"   - {issue}")
        
        print("\n🔧 해결 방법:")
        print("1. 호환성 라이브러리 다운그레이드 (권장)")
        print("   uv add 'torch>=2.0.0,<2.6.0' 'torchaudio>=2.0.0,<2.6.0' 'transformers>=4.21.0,<4.50.0'")
        print("   또는")
        print("   pip install 'torch>=2.0.0,<2.6.0' 'torchaudio>=2.0.0,<2.6.0' 'transformers>=4.21.0,<4.50.0'")
        print()
        
        # 자동 해결 제안
        print("🤖 자동으로 호환성 문제를 해결하시겠습니까? (y/n): ", end="")
        response = input().lower().strip()
        
        if response in ['y', 'yes', 'ㅇ']:
            print("\n📥 호환성 라이브러리 다운그레이드 중...")
            
            # uv가 있는지 확인
            uv_available, _, _ = run_command("uv --version")
            
            if uv_available:
                print("🔄 uv를 사용하여 호환성 라이브러리 설치...")
                success, stdout, stderr = run_command(
                    "uv add 'torch>=2.0.0,<2.6.0' 'torchaudio>=2.0.0,<2.6.0' 'transformers>=4.21.0,<4.50.0'"
                )
            else:
                print("🔄 pip를 사용하여 호환성 라이브러리 설치...")
                success, stdout, stderr = run_command(
                    "pip install 'torch>=2.0.0,<2.6.0' 'torchaudio>=2.0.0,<2.6.0' 'transformers>=4.21.0,<4.50.0'"
                )
            
            if success:
                print("✅ 호환성 라이브러리 설치 완료!")
                print("🔄 서버를 재시작해주세요.")
            else:
                print("❌ 라이브러리 설치 실패:")
                print(stderr)
    else:
        print("✅ 추가 작업이 필요하지 않습니다.")
    
    # 4. TTS 테스트 제안
    print("\n🧪 TTS 기능 테스트를 실행하시겠습니까? (y/n): ", end="")
    response = input().lower().strip()
    
    if response in ['y', 'yes', 'ㅇ']:
        print("\n🧪 TTS 기능 테스트 중...")
        
        try:
            # TTS 임포트 테스트
            print("📦 TTS 라이브러리 임포트 테스트...")
            from TTS.api import TTS
            print("✅ TTS 임포트 성공")
            
            # 모델 로딩 테스트 (가장 작은 모델 사용)
            print("🤖 TTS 모델 로딩 테스트...")
            model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
            
            # PyTorch 안전 글로벌 설정
            try:
                import torch
                from TTS.tts.configs.xtts_config import XttsConfig
                torch.serialization.add_safe_globals([XttsConfig])
                print("✅ PyTorch 안전 글로벌 설정 완료")
            except Exception as e:
                print(f"⚠️  안전 글로벌 설정 실패: {e}")
            
            try:
                tts = TTS(model_name, gpu=False)  # CPU 모드로 테스트
                print("✅ TTS 모델 로딩 성공")
                
                # 간단한 TTS 테스트
                test_text = "안녕하세요. 테스트입니다."
                output_path = "test_output.wav"
                
                # TTS 생성 시도
                try:
                    tts.tts_to_file(text=test_text, file_path=output_path, language="ko")
                    print("✅ TTS 생성 테스트 성공")
                except Exception as tts_error:
                    if "generate" in str(tts_error) or "GPT2InferenceModel" in str(tts_error):
                        print(f"❌ Transformers 호환성 문제 감지: {tts_error}")
                        print("🔧 transformers<4.50 으로 다운그레이드가 필요합니다.")
                    else:
                        print(f"❌ TTS 생성 실패: {tts_error}")
                
                # 파일 정리
                import os
                if os.path.exists(output_path):
                    os.remove(output_path)
                
            except Exception as e:
                print(f"❌ TTS 모델 로딩/생성 실패: {e}")
                
                if "weights_only" in str(e) or "WeightsUnpickler" in str(e):
                    print("🚨 여전히 PyTorch 2.6+ 호환성 문제가 있습니다.")
                    print("📋 추가 해결 방법:")
                    print("1. 가상환경을 새로 만들고 패키지 재설치")
                    print("2. TTS 라이브러리 최신 버전으로 업데이트")
                    print("3. PyTorch 1.13.x 버전으로 다운그레이드")
                
        except ImportError as e:
            print(f"❌ TTS 라이브러리 임포트 실패: {e}")
            print("📦 TTS 설치 명령어:")
            print("   uv add TTS")
            print("   또는")
            print("   pip install TTS")
    
    print("\n" + "=" * 50)
    print("🎉 TTS 호환성 진단 완료")
    print("📝 문제가 지속되면 다음을 시도해보세요:")
    print("   1. 가상환경 재생성")
    print("   2. 캐시 정리: pip cache purge")
    print("   3. 의존성 재설치: uv sync")
    print("   4. 서버 재시작")
    print("")
    print("🚨 주요 호환성 이슈:")
    print("   - PyTorch 2.6+: weights_only 기본값 변경")
    print("   - Transformers 4.50+: GPT2InferenceModel.generate 제거")

if __name__ == "__main__":
    main()
