#!/usr/bin/env python3
"""
TTS 데이터베이스 상태 확인 스크립트
"""
import asyncio
import sys
from pathlib import Path

# 프로젝트 루트를 Python path에 추가
sys.path.append(str(Path(__file__).parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.tts import TTSScript, TTSGeneration
from app.models.voice_actor import VoiceActor
from app.models.users import User

def check_database_status():
    """데이터베이스 상태 확인"""
    try:
        with Session(engine) as session:
            print("🔍 데이터베이스 연결 성공!")
            
            # 사용자 수 확인
            users_count = len(session.exec(select(User)).all())
            print(f"👥 총 사용자 수: {users_count}")
            
            # 성우 수 확인
            voice_actors_count = len(session.exec(select(VoiceActor)).all())
            print(f"🎭 총 성우 수: {voice_actors_count}")
            
            # TTS 스크립트 수 확인
            tts_scripts_count = len(session.exec(select(TTSScript)).all())
            print(f"📝 총 TTS 스크립트 수: {tts_scripts_count}")
            
            # TTS 생성 작업 수 확인
            tts_generations_count = len(session.exec(select(TTSGeneration)).all())
            print(f"🎵 총 TTS 생성 작업 수: {tts_generations_count}")
            
            # 최근 TTS 스크립트 10개 조회
            print("\n📋 최근 TTS 스크립트 목록:")
            recent_scripts = session.exec(
                select(TTSScript).order_by(TTSScript.created_at.desc()).limit(10)
            ).all()
            
            if recent_scripts:
                for i, script in enumerate(recent_scripts, 1):
                    print(f"  {i}. ID: {script.id}")
                    print(f"     내용: {script.text_content[:50]}...")
                    print(f"     생성일: {script.created_at}")
                    print(f"     생성자: {script.created_by}")
                    print()
            else:
                print("  ❌ TTS 스크립트가 없습니다.")
            
            # 성우 목록 확인
            print("🎭 성우 목록:")
            voice_actors = session.exec(select(VoiceActor)).all()
            if voice_actors:
                for actor in voice_actors:
                    print(f"  - {actor.name} ({actor.gender}, {actor.age_range})")
            else:
                print("  ❌ 등록된 성우가 없습니다.")
                
            return True
            
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        return False

def create_sample_data():
    """샘플 데이터 생성"""
    print("\n🛠️ 샘플 데이터 생성 중...")
    
    try:
        with Session(engine) as session:
            # 첫 번째 사용자 조회 (슈퍼유저)
            first_user = session.exec(select(User).limit(1)).first()
            if not first_user:
                print("❌ 사용자가 없습니다. 먼저 사용자를 생성하세요.")
                return False
            
            print(f"👤 사용자 확인: {first_user.email}")
            
            # 샘플 성우 생성
            from app.models.voice_actor import VoiceActor, GenderType, AgeRangeType
            
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
                }
            ]
            
            created_count = 0
            for script_data in sample_scripts:
                # 중복 확인
                existing_script = session.exec(
                    select(TTSScript).where(TTSScript.text_content == script_data["text_content"])
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
        return False

def main():
    """메인 함수"""
    print("🔍 TTS 데이터베이스 상태 확인 시작")
    print("=" * 50)
    
    # 데이터베이스 상태 확인
    if not check_database_status():
        return
    
    # 샘플 데이터 생성 여부 확인
    with Session(engine) as session:
        scripts_count = len(session.exec(select(TTSScript)).all())
        
    if scripts_count == 0:
        print("\n❓ TTS 스크립트가 없습니다. 샘플 데이터를 생성하시겠습니까? (y/n): ", end="")
        try:
            response = input().lower().strip()
            if response == 'y' or response == 'yes':
                create_sample_data()
                print("\n" + "=" * 50)
                print("🔍 데이터 생성 후 상태 재확인")
                check_database_status()
        except KeyboardInterrupt:
            print("\n⏹️ 작업이 취소되었습니다.")
    
    print("\n✅ 데이터베이스 상태 확인 완료")

if __name__ == "__main__":
    main()
