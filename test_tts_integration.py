#!/usr/bin/env python3
"""
TTS 기능 통합 테스트 스크립트

이 스크립트는 다음을 테스트합니다:
1. TTS 서비스 초기화
2. Mock TTS 생성 (실제 TTS 모델 없이도 동작)
3. 오디오 파일 생성 및 품질 점수 계산
"""

import asyncio
import uuid
import os
import sys
from pathlib import Path

# 프로젝트 루트를 Python path에 추가
project_root = Path(__file__).parent / "backend"
sys.path.insert(0, str(project_root))

from app.services.tts_service import TTSService

async def test_mock_tts():
    """Mock TTS 기능 테스트"""
    print("🎙️ TTS 서비스 테스트 시작...")
    
    # TTS 서비스 인스턴스 생성
    tts_service = TTSService()
    
    # 테스트 텍스트
    test_text = "안녕하세요. OO손해보험입니다. 무엇을 도와드릴까요?"
    
    print(f"📝 테스트 텍스트: {test_text}")
    
    try:
        # Mock TTS 오디오 생성
        output_filename = f"test_tts_{uuid.uuid4().hex[:8]}.wav"
        output_path = tts_service.audio_files_dir / output_filename
        
        print(f"🎵 Mock 오디오 생성 중... ({output_path})")
        
        await tts_service._create_mock_audio(str(output_path), test_text)
        
        if output_path.exists():
            file_size = output_path.stat().st_size
            print(f"✅ Mock 오디오 파일 생성 성공!")
            print(f"   - 파일 크기: {file_size:,} bytes")
            print(f"   - 파일 경로: {output_path}")
            
            # 오디오 길이 계산 테스트
            duration = await tts_service._get_audio_duration(str(output_path))
            print(f"   - 예상 길이: {duration:.2f}초")
            
            # 품질 점수 계산 테스트
            quality_score = await tts_service._calculate_quality_score(str(output_path), test_text)
            print(f"   - 품질 점수: {quality_score:.1f}점")
            
            # 테스트 파일 삭제
            output_path.unlink()
            print(f"🧹 테스트 파일 삭제 완료")
            
        else:
            print("❌ Mock 오디오 파일 생성 실패")
            return False
            
    except Exception as e:
        print(f"❌ TTS 테스트 중 오류 발생: {e}")
        return False
    
    print("✅ TTS 서비스 테스트 완료!")
    return True

async def test_tts_model_initialization():
    """TTS 모델 초기화 테스트"""
    print("\n🔧 TTS 모델 초기화 테스트...")
    
    tts_service = TTSService()
    
    try:
        await tts_service.initialize_tts_model()
        
        if tts_service.tts_model == "mock":
            print("✅ Mock TTS 모델로 초기화 성공 (실제 TTS 라이브러리 없음)")
        elif tts_service.tts_model is not None:
            print("✅ 실제 TTS 모델 초기화 성공")
        else:
            print("❌ TTS 모델 초기화 실패")
            return False
            
    except Exception as e:
        print(f"❌ TTS 모델 초기화 중 오류: {e}")
        return False
    
    return True

async def test_audio_directory():
    """오디오 디렉토리 생성 테스트"""
    print("\n📁 오디오 디렉토리 테스트...")
    
    tts_service = TTSService()
    
    # 디렉토리 존재 확인
    if tts_service.audio_files_dir.exists():
        print(f"✅ 오디오 디렉토리 존재: {tts_service.audio_files_dir}")
    else:
        print(f"❌ 오디오 디렉토리 없음: {tts_service.audio_files_dir}")
        return False
    
    # 쓰기 권한 테스트
    test_file = tts_service.audio_files_dir / "test_write.txt"
    try:
        test_file.write_text("test")
        test_file.unlink()
        print("✅ 디렉토리 쓰기 권한 확인")
    except Exception as e:
        print(f"❌ 디렉토리 쓰기 권한 없음: {e}")
        return False
    
    return True

async def main():
    """메인 테스트 함수"""
    print("=" * 60)
    print("🧪 TTS 통합 테스트")
    print("=" * 60)
    
    # 현재 작업 디렉토리를 backend로 변경
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    print(f"📂 작업 디렉토리: {os.getcwd()}")
    
    tests = [
        ("오디오 디렉토리", test_audio_directory),
        ("TTS 모델 초기화", test_tts_model_initialization),
        ("Mock TTS 생성", test_mock_tts),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 {test_name} 테스트 실행...")
        try:
            result = await test_func()
            if result:
                passed += 1
                print(f"✅ {test_name} 테스트 통과")
            else:
                print(f"❌ {test_name} 테스트 실패")
        except Exception as e:
            print(f"❌ {test_name} 테스트 중 예외 발생: {e}")
    
    print("\n" + "=" * 60)
    print(f"📊 테스트 결과: {passed}/{total} 통과")
    
    if passed == total:
        print("🎉 모든 TTS 테스트가 성공적으로 완료되었습니다!")
        print("\n💡 다음 단계:")
        print("   1. 백엔드 서버 시작: cd backend && python -m uvicorn app.main:app --reload")
        print("   2. 프론트엔드 시작: cd frontend/ment-gen && npm run dev")
        print("   3. 브라우저에서 http://localhost:3000/voice-actors 접속")
        print("   4. TTS 생성 기능 테스트")
    else:
        print("⚠️  일부 테스트가 실패했습니다. 로그를 확인해주세요.")
    
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
