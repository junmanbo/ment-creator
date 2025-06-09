#!/usr/bin/env python3
"""
TTS API 테스트 및 샘플 데이터 생성 스크립트
"""
import asyncio
import sys
import requests
import json
from pathlib import Path

# 프로젝트 루트를 Python path에 추가
sys.path.append(str(Path(__file__).parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.tts import TTSScript, TTSGeneration
from app.models.voice_actor import VoiceActor, GenderType, AgeRangeType
from app.models.users import User

# API 기본 URL
API_BASE_URL = "http://localhost:8000/api/v1"

def check_database_status():
    """데이터베이스 상태 확인"""
    print("🔍 데이터베이스 상태 확인 중...")
    
    try:
        with Session(engine) as session:
            # 사용자 수 확인
            users = session.exec(select(User)).all()
            print(f"👥 총 사용자 수: {len(users)}")
            
            # 성우 수 확인
            voice_actors = session.exec(select(VoiceActor)).all()
            print(f"🎭 총 성우 수: {len(voice_actors)}")
            
            # TTS 스크립트 수 확인
            tts_scripts = session.exec(select(TTSScript)).all()
            print(f"📝 총 TTS 스크립트 수: {len(tts_scripts)}")
            
            # 첫 번째 사용자 정보
            if users:
                first_user = users[0]
                print(f"👤 첫 번째 사용자: {first_user.email} (ID: {first_user.id})")
            
            # 최근 TTS 스크립트 5개 조회
            if tts_scripts:
                print("\n📋 TTS 스크립트 목록:")
                for i, script in enumerate(tts_scripts[:5], 1):
                    print(f"  {i}. {script.text_content[:50]}...")
                    print(f"     생성자: {script.created_by}")
                    print(f"     성우 ID: {script.voice_actor_id}")
                    print()
            
            return True, users, voice_actors, tts_scripts
            
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        return False, [], [], []

def create_sample_data():
    """샘플 데이터 직접 생성"""
    print("\n🛠️ 샘플 데이터 생성 중...")
    
    try:
        with Session(engine) as session:
            # 첫 번째 사용자 조회
            first_user = session.exec(select(User).limit(1)).first()
            if not first_user:
                print("❌ 사용자가 없습니다. 먼저 사용자를 생성하세요.")
                return False
            
            print(f"👤 사용자 확인: {first_user.email}")
            
            # 샘플 성우 생성
            sample_actor = VoiceActor(
                name="김서연",
                gender=GenderType.FEMALE,
                age_range=AgeRangeType.THIRTIES,
                language="ko",
                description="친근하고 따뜻한 목소리의 전문 성우",
                characteristics={"tone": "친근함", "style": "밝음", "specialty": "보험업계"},
                is_active=True,
                created_by=first_user.id
            )
            
            # 기존에 같은 이름의 성우가 있는지 확인
            existing_actor = session.exec(
                select(VoiceActor).where(VoiceActor.name == sample_actor.name)
            ).first()
            
            if not existing_actor:
                session.add(sample_actor)
                session.commit()
                session.refresh(sample_actor)
                print(f"✅ 샘플 성우 생성: {sample_actor.name}")
            else:
                sample_actor = existing_actor
                print(f"ℹ️ 기존 성우 사용: {sample_actor.name}")
            
            # 샘플 TTS 스크립트들 생성
            sample_scripts = [
                {
                    "text_content": "안녕하세요. OO손해보험 고객센터입니다. 무엇을 도와드릴까요?",
                    "voice_settings": {"speed": 1.0, "tone": "friendly", "emotion": "bright"}
                },
                {
                    "text_content": "메뉴를 선택해 주세요. 1번 자동차보험, 2번 화재보험, 9번 상담원 연결입니다.",
                    "voice_settings": {"speed": 0.9, "tone": "clear", "emotion": "neutral"}
                },
                {
                    "text_content": "상담원에게 연결해 드리겠습니다. 잠시만 기다려 주세요.",
                    "voice_settings": {"speed": 1.0, "tone": "polite", "emotion": "calm"}
                },
                {
                    "text_content": "감사합니다. 좋은 하루 되세요.",
                    "voice_settings": {"speed": 1.0, "tone": "warm", "emotion": "bright"}
                },
                {
                    "text_content": "죄송합니다. 다시 한 번 말씀해 주시겠습니까?",
                    "voice_settings": {"speed": 0.9, "tone": "polite", "emotion": "apologetic"}
                }
            ]
            
            created_count = 0
            for script_data in sample_scripts:
                # 중복 확인 (사용자별)
                existing_script = session.exec(
                    select(TTSScript)
                    .where(TTSScript.text_content == script_data["text_content"])
                    .where(TTSScript.created_by == first_user.id)
                ).first()
                
                if not existing_script:
                    new_script = TTSScript(
                        text_content=script_data["text_content"],
                        voice_actor_id=sample_actor.id,
                        voice_settings=script_data["voice_settings"],
                        created_by=first_user.id
                    )
                    session.add(new_script)
                    created_count += 1
            
            if created_count > 0:
                session.commit()
                print(f"✅ {created_count}개의 샘플 TTS 스크립트 생성")
            else:
                print("ℹ️ 샘플 TTS 스크립트가 이미 존재합니다.")
            
            return True
            
    except Exception as e:
        print(f"❌ 샘플 데이터 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_response():
    """API 응답 테스트"""
    print("\n🧪 API 응답 테스트 중...")
    
    try:
        # API 서버 상태 확인
        response = requests.get(f"{API_BASE_URL}/voice-actors/test", timeout=5)
        if response.status_code == 200:
            print("✅ 백엔드 서버 연결 성공")
            print(f"   응답: {response.json()}")
        else:
            print(f"⚠️ 백엔드 서버 응답 오류: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ 백엔드 서버 연결 실패: {e}")
        print("💡 백엔드 서버가 실행 중인지 확인하세요.")
        return False
    
    return True

def main():
    """메인 함수"""
    print("🚀 TTS API 테스트 및 데이터 확인 시작")
    print("=" * 60)
    
    # 1. 데이터베이스 상태 확인
    status, users, voice_actors, scripts = check_database_status()
    if not status:
        print("❌ 데이터베이스 연결에 실패했습니다.")
        return
    
    # 2. API 서버 연결 테스트
    if not test_api_response():
        print("⚠️ API 서버 연결에 실패했지만 계속 진행합니다.")
    
    # 3. 샘플 데이터 생성 (스크립트가 없는 경우)
    if len(scripts) == 0:
        print("\n❓ TTS 스크립트가 없습니다. 샘플 데이터를 생성합니다.")
        if create_sample_data():
            print("\n" + "=" * 60)
            print("🔍 데이터 생성 후 상태 재확인")
            check_database_status()
    else:
        print(f"\n✅ TTS 스크립트 {len(scripts)}개가 이미 존재합니다.")
    
    # 4. 프론트엔드 연결을 위한 정보 출력
    print("\n📱 프론트엔드 연결 정보:")
    print(f"   API Base URL: {API_BASE_URL}")
    print(f"   TTS Scripts 엔드포인트: {API_BASE_URL}/voice-actors/tts-scripts")
    
    if users:
        print(f"   테스트 사용자: {users[0].email}")
        print("   💡 로그인 후 /ars-ment-management/list 페이지에서 데이터를 확인하세요.")
    
    print("\n✅ 테스트 완료")

if __name__ == "__main__":
    main()
