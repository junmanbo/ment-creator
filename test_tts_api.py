#!/usr/bin/env python3
"""
TTS API 테스트 스크립트

이 스크립트는 실제 API를 통해 TTS 기능을 테스트합니다:
1. 사용자 로그인
2. 성우 등록
3. TTS 스크립트 생성
4. TTS 생성 요청
5. 생성 상태 확인
6. 오디오 파일 다운로드
"""

import asyncio
import aiohttp
import json
import uuid
import os
from pathlib import Path

# 설정
API_BASE_URL = "http://localhost:8000/api/v1"
TEST_USER = {
    "username": "test_user",
    "password": "test_password123",
    "email": "test@example.com",
    "full_name": "테스트 사용자"
}

TEST_VOICE_ACTOR = {
    "name": "김소연",
    "gender": "female", 
    "age_range": "30s",
    "language": "ko",
    "description": "친근하고 따뜻한 목소리의 전문 성우",
    "characteristics": {
        "tone": "친근함",
        "style": "밝음", 
        "specialty": "보험업계"
    }
}

TEST_TTS_TEXT = "안녕하세요. OO손해보험입니다. 고객님의 소중한 재산을 보호하기 위해 최선을 다하겠습니다. 무엇을 도와드릴까요?"

class TTSAPITester:
    def __init__(self):
        self.session = None
        self.access_token = None
        self.voice_actor_id = None
        self.script_id = None
        self.generation_id = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def register_user(self):
        """사용자 등록"""
        print("👤 사용자 등록 중...")
        
        try:
            async with self.session.post(
                f"{API_BASE_URL}/auth/register",
                json=TEST_USER
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ 사용자 등록 성공: {result.get('username')}")
                    return True
                elif response.status == 400:
                    error = await response.json()
                    if "already registered" in error.get("detail", ""):
                        print("ℹ️  사용자가 이미 등록되어 있습니다.")
                        return True
                    else:
                        print(f"❌ 등록 실패: {error}")
                        return False
                else:
                    print(f"❌ 등록 실패: HTTP {response.status}")
                    return False
        except Exception as e:
            print(f"❌ 등록 중 오류: {e}")
            return False
    
    async def login(self):
        """사용자 로그인"""
        print("🔐 로그인 중...")
        
        try:
            login_data = {
                "username": TEST_USER["username"],
                "password": TEST_USER["password"]
            }
            
            async with self.session.post(
                f"{API_BASE_URL}/auth/login",
                data=login_data  # form data로 전송
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    self.access_token = result["access_token"]
                    print(f"✅ 로그인 성공")
                    return True
                else:
                    error = await response.json()
                    print(f"❌ 로그인 실패: {error}")
                    return False
        except Exception as e:
            print(f"❌ 로그인 중 오류: {e}")
            return False
    
    def get_headers(self):
        """인증 헤더 반환"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    async def create_voice_actor(self):
        """성우 등록"""
        print("🎭 성우 등록 중...")
        
        try:
            async with self.session.post(
                f"{API_BASE_URL}/voice-actors",
                json=TEST_VOICE_ACTOR,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    self.voice_actor_id = result["id"]
                    print(f"✅ 성우 등록 성공: {result['name']} (ID: {self.voice_actor_id})")
                    return True
                else:
                    error = await response.json()
                    print(f"❌ 성우 등록 실패: {error}")
                    return False
        except Exception as e:
            print(f"❌ 성우 등록 중 오류: {e}")
            return False
    
    async def create_tts_script(self):
        """TTS 스크립트 생성"""
        print("📝 TTS 스크립트 생성 중...")
        
        try:
            script_data = {
                "text_content": TEST_TTS_TEXT,
                "voice_actor_id": self.voice_actor_id,
                "voice_settings": {
                    "speed": 1.0,
                    "temperature": 0.7
                }
            }
            
            async with self.session.post(
                f"{API_BASE_URL}/voice-actors/tts-scripts",
                json=script_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    self.script_id = result["id"]
                    print(f"✅ TTS 스크립트 생성 성공 (ID: {self.script_id})")
                    print(f"   텍스트: {result['text_content'][:50]}...")
                    return True
                else:
                    error = await response.json()
                    print(f"❌ TTS 스크립트 생성 실패: {error}")
                    return False
        except Exception as e:
            print(f"❌ TTS 스크립트 생성 중 오류: {e}")
            return False
    
    async def generate_tts(self):
        """TTS 생성 요청"""
        print("🎵 TTS 생성 요청 중...")
        
        try:
            generate_data = {
                "script_id": self.script_id,
                "generation_params": {
                    "quality": "high"
                }
            }
            
            async with self.session.post(
                f"{API_BASE_URL}/voice-actors/tts-scripts/{self.script_id}/generate",
                json=generate_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    self.generation_id = result["id"]
                    print(f"✅ TTS 생성 요청 성공 (ID: {self.generation_id})")
                    print(f"   상태: {result['status']}")
                    return True
                else:
                    error = await response.json()
                    print(f"❌ TTS 생성 요청 실패: {error}")
                    return False
        except Exception as e:
            print(f"❌ TTS 생성 요청 중 오류: {e}")
            return False
    
    async def check_generation_status(self, max_attempts=30):
        """TTS 생성 상태 확인"""
        print("⏳ TTS 생성 상태 확인 중...")
        
        for attempt in range(max_attempts):
            try:
                async with self.session.get(
                    f"{API_BASE_URL}/voice-actors/tts-generations/{self.generation_id}",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        status = result["status"]
                        
                        print(f"   시도 {attempt + 1}: 상태 = {status}")
                        
                        if status == "completed":
                            print(f"✅ TTS 생성 완료!")
                            if result.get("quality_score"):
                                print(f"   품질 점수: {result['quality_score']:.1f}점")
                            if result.get("duration"):
                                print(f"   길이: {result['duration']:.2f}초")
                            if result.get("file_size"):
                                print(f"   파일 크기: {result['file_size']:,} bytes")
                            return True
                        
                        elif status == "failed":
                            error_msg = result.get("error_message", "알 수 없는 오류")
                            print(f"❌ TTS 생성 실패: {error_msg}")
                            return False
                        
                        elif status in ["pending", "processing"]:
                            # 계속 대기
                            await asyncio.sleep(2)
                            continue
                        
                        else:
                            print(f"❌ 알 수 없는 상태: {status}")
                            return False
                    
                    else:
                        print(f"❌ 상태 확인 실패: HTTP {response.status}")
                        return False
                        
            except Exception as e:
                print(f"❌ 상태 확인 중 오류: {e}")
                await asyncio.sleep(2)
                continue
        
        print(f"❌ TTS 생성 시간 초과 (최대 {max_attempts}번 시도)")
        return False
    
    async def download_audio(self):
        """생성된 오디오 파일 다운로드"""
        print("📥 오디오 파일 다운로드 중...")
        
        try:
            async with self.session.get(
                f"{API_BASE_URL}/voice-actors/tts-generations/{self.generation_id}/audio",
                headers={"Authorization": f"Bearer {self.access_token}"}
            ) as response:
                if response.status == 200:
                    # 다운로드 디렉토리 생성
                    download_dir = Path("downloads")
                    download_dir.mkdir(exist_ok=True)
                    
                    # 파일명 생성
                    filename = f"tts_test_{self.generation_id[:8]}.wav"
                    file_path = download_dir / filename
                    
                    # 파일 저장
                    with open(file_path, "wb") as f:
                        async for chunk in response.content.iter_chunked(1024):
                            f.write(chunk)
                    
                    file_size = file_path.stat().st_size
                    print(f"✅ 오디오 파일 다운로드 성공!")
                    print(f"   파일 경로: {file_path.absolute()}")
                    print(f"   파일 크기: {file_size:,} bytes")
                    return True
                    
                else:
                    error = await response.text()
                    print(f"❌ 오디오 다운로드 실패: HTTP {response.status}")
                    print(f"   오류: {error}")
                    return False
                    
        except Exception as e:
            print(f"❌ 오디오 다운로드 중 오류: {e}")
            return False

async def main():
    """메인 테스트 함수"""
    print("=" * 70)
    print("🧪 TTS API 통합 테스트")
    print("=" * 70)
    print(f"🌐 API URL: {API_BASE_URL}")
    print(f"👤 테스트 사용자: {TEST_USER['username']}")
    print(f"🎭 테스트 성우: {TEST_VOICE_ACTOR['name']}")
    print(f"📝 테스트 텍스트: {TEST_TTS_TEXT[:50]}...")
    print("=" * 70)
    
    async with TTSAPITester() as tester:
        tests = [
            ("사용자 등록", tester.register_user),
            ("로그인", tester.login),
            ("성우 등록", tester.create_voice_actor),
            ("TTS 스크립트 생성", tester.create_tts_script),
            ("TTS 생성 요청", tester.generate_tts),
            ("TTS 생성 상태 확인", tester.check_generation_status),
            ("오디오 파일 다운로드", tester.download_audio),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 {test_name} 실행...")
            try:
                result = await test_func()
                if result:
                    passed += 1
                    print(f"✅ {test_name} 성공")
                else:
                    print(f"❌ {test_name} 실패")
                    # 중요한 단계가 실패하면 중단
                    if test_name in ["로그인", "TTS 생성 요청"]:
                        print("💥 중요한 단계 실패로 테스트 중단")
                        break
            except Exception as e:
                print(f"❌ {test_name} 중 예외 발생: {e}")
                break
        
        print("\n" + "=" * 70)
        print(f"📊 테스트 결과: {passed}/{total} 성공")
        
        if passed == total:
            print("🎉 모든 TTS API 테스트가 성공적으로 완료되었습니다!")
            print("\n💡 테스트된 기능:")
            print("   ✅ 사용자 인증")
            print("   ✅ 성우 관리")
            print("   ✅ TTS 스크립트 생성")
            print("   ✅ TTS 생성 처리")
            print("   ✅ 상태 모니터링")
            print("   ✅ 오디오 파일 다운로드")
            print("\n🚀 이제 프론트엔드에서도 동일한 기능을 테스트해보세요!")
        else:
            print("⚠️  일부 테스트가 실패했습니다.")
            print("💡 다음을 확인해주세요:")
            print("   1. 백엔드 서버가 실행 중인지 확인 (http://localhost:8000)")
            print("   2. 데이터베이스가 정상 작동하는지 확인")
            print("   3. TTS 서비스가 올바르게 구성되었는지 확인")
        
        print("=" * 70)

if __name__ == "__main__":
    print("📋 사전 요구사항:")
    print("   1. 백엔드 서버가 http://localhost:8000에서 실행 중이어야 합니다")
    print("   2. PostgreSQL 데이터베이스가 설정되어 있어야 합니다")
    print("   3. 마이그레이션이 완료되어 있어야 합니다")
    print()
    
    response = input("계속 진행하시겠습니까? (y/N): ")
    if response.lower() in ['y', 'yes']:
        asyncio.run(main())
    else:
        print("테스트가 취소되었습니다.")
