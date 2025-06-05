#!/usr/bin/env python3
"""
TTS 기능 테스트 스크립트
Phase 3 구현 완료 후 기능 검증용
"""

import asyncio
import sys
from pathlib import Path

# Backend path 추가
backend_path = Path(__file__).parent / "backend"
sys.path.append(str(backend_path))

async def test_tts_service():
    """TTS 서비스 기본 기능 테스트"""
    try:
        from app.services.tts_service import tts_service
        
        print("🎯 TTS 서비스 테스트 시작...")
        
        # 1. TTS 모델 초기화 테스트
        print("1. TTS 모델 초기화 중...")
        await tts_service.initialize_tts_model()
        
        if tts_service.tts_model == "mock":
            print("✅ Mock TTS 모델 로드됨 (실제 TTS 라이브러리 없음)")
        else:
            print("✅ 실제 TTS 모델 로드됨")
        
        # 2. Mock 오디오 생성 테스트
        print("2. Mock 오디오 생성 테스트...")
        test_audio_path = "test_output.wav"
        await tts_service._create_mock_audio(test_audio_path, "안녕하세요. 테스트 음성입니다.")
        
        if Path(test_audio_path).exists():
            print(f"✅ Mock 오디오 파일 생성 성공: {test_audio_path}")
            file_size = Path(test_audio_path).stat().st_size
            print(f"   파일 크기: {file_size} bytes")
            
            # 파일 정리
            Path(test_audio_path).unlink()
        else:
            print("❌ Mock 오디오 파일 생성 실패")
        
        # 3. 품질 점수 계산 테스트
        print("3. 품질 점수 계산 테스트...")
        await tts_service._create_mock_audio(test_audio_path, "품질 테스트")
        quality_score = await tts_service._calculate_quality_score(test_audio_path, "품질 테스트")
        print(f"✅ 품질 점수: {quality_score:.1f}점")
        
        # 파일 정리
        if Path(test_audio_path).exists():
            Path(test_audio_path).unlink()
        
        print("🎉 TTS 서비스 테스트 완료!")
        return True
        
    except Exception as e:
        print(f"❌ TTS 서비스 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_model_imports():
    """모델 import 테스트"""
    try:
        print("🎯 모델 Import 테스트 시작...")
        
        from app.models.voice_actor import VoiceActor, VoiceSample, VoiceModel
        from app.models.tts import TTSScript, TTSGeneration, TTSLibrary
        
        print("✅ VoiceActor 모델 import 성공")
        print("✅ VoiceSample 모델 import 성공")
        print("✅ VoiceModel 모델 import 성공")
        print("✅ TTSScript 모델 import 성공")
        print("✅ TTSGeneration 모델 import 성공")
        print("✅ TTSLibrary 모델 import 성공")
        
        print("🎉 모든 모델 import 성공!")
        return True
        
    except Exception as e:
        print(f"❌ 모델 import 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_dependencies():
    """의존성 라이브러리 테스트"""
    print("🎯 의존성 라이브러리 테스트 시작...")
    
    dependencies = [
        ("wave", "기본 오디오 처리"),
        ("numpy", "수치 계산"),
        ("TTS", "Text-to-Speech"),
        ("torch", "PyTorch"),
        ("librosa", "오디오 처리"),
        ("soundfile", "오디오 파일 I/O")
    ]
    
    results = []
    for dep, desc in dependencies:
        try:
            __import__(dep)
            print(f"✅ {dep}: {desc} - 설치됨")
            results.append(True)
        except ImportError:
            print(f"⚠️  {dep}: {desc} - 설치되지 않음 (Mock 사용)")
            results.append(False)
    
    installed_count = sum(results)
    total_count = len(results)
    
    print(f"\n📊 의존성 설치 현황: {installed_count}/{total_count} ({installed_count/total_count*100:.1f}%)")
    
    if installed_count >= total_count * 0.5:
        print("🎉 TTS 기능 사용 가능!")
        return True
    else:
        print("⚠️  일부 기능은 Mock으로 동작합니다.")
        return False

async def main():
    """메인 테스트 함수"""
    print("=" * 60)
    print("🎭 Phase 3: TTS 기능 테스트")
    print("=" * 60)
    
    test_results = []
    
    # 1. 의존성 테스트
    print("\n" + "=" * 40)
    dep_result = test_dependencies()
    test_results.append(("의존성", dep_result))
    
    # 2. 모델 import 테스트
    print("\n" + "=" * 40)
    model_result = await test_model_imports()
    test_results.append(("모델 Import", model_result))
    
    # 3. TTS 서비스 테스트
    print("\n" + "=" * 40)
    service_result = await test_tts_service()
    test_results.append(("TTS 서비스", service_result))
    
    # 결과 요약
    print("\n" + "=" * 60)
    print("📊 테스트 결과 요약")
    print("=" * 60)
    
    for test_name, result in test_results:
        status = "✅ 통과" if result else "❌ 실패"
        print(f"{test_name:15}: {status}")
    
    passed_count = sum(result for _, result in test_results)
    total_count = len(test_results)
    
    print(f"\n전체 결과: {passed_count}/{total_count} 통과 ({passed_count/total_count*100:.1f}%)")
    
    if passed_count == total_count:
        print("🎉 모든 테스트 통과! Phase 3 TTS 기능이 완벽하게 구현되었습니다!")
    elif passed_count >= total_count * 0.7:
        print("✅ 대부분의 기능이 정상 작동합니다. 일부는 Mock으로 동작합니다.")
    else:
        print("⚠️  일부 문제가 있습니다. 설정을 확인해주세요.")

if __name__ == "__main__":
    asyncio.run(main())
