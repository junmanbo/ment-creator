#!/bin/bash

# TTS 멘트 목록 문제 해결 스크립트
echo "🔧 TTS 멘트 목록 문제 해결을 시작합니다..."

cd /home/jun/projects/ment-creator/backend

# 1. 백엔드 서버 상태 확인
echo "1️⃣ 백엔드 서버 상태 확인 중..."
if curl -s -f http://localhost:8000/api/v1/voice-actors/test >/dev/null 2>&1; then
    echo "✅ 백엔드 서버가 실행 중입니다."
else
    echo "❌ 백엔드 서버가 실행되지 않았습니다."
    echo "💡 백엔드 서버를 시작하세요: cd backend && ./start_server.sh"
fi

# 2. 데이터베이스 연결 테스트
echo -e "\n2️⃣ 데이터베이스 연결 테스트 중..."
python3 -c "
import sys
sys.path.append('.')
try:
    from sqlmodel import Session, select
    from app.core.db import engine
    from app.models.users import User
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        print(f'✅ 데이터베이스 연결 성공 (사용자: {len(users)}명)')
except Exception as e:
    print(f'❌ 데이터베이스 연결 실패: {e}')
"

# 3. TTS 스크립트 데이터 확인
echo -e "\n3️⃣ TTS 스크립트 데이터 확인 중..."
python3 -c "
import sys
sys.path.append('.')
try:
    from sqlmodel import Session, select
    from app.core.db import engine
    from app.models.tts import TTSScript
    from app.models.voice_actor import VoiceActor
    with Session(engine) as session:
        scripts = session.exec(select(TTSScript)).all()
        actors = session.exec(select(VoiceActor)).all()
        print(f'📝 TTS 스크립트: {len(scripts)}개')
        print(f'🎭 성우: {len(actors)}명')
        
        if len(scripts) == 0:
            print('⚠️ TTS 스크립트가 없습니다.')
        else:
            for i, script in enumerate(scripts[:3], 1):
                print(f'   {i}. {script.text_content[:40]}...')
except Exception as e:
    print(f'❌ 데이터 조회 실패: {e}')
"

# 4. API 엔드포인트 테스트
echo -e "\n4️⃣ API 엔드포인트 테스트 중..."
if curl -s -f http://localhost:8000/api/v1/voice-actors/test >/dev/null 2>&1; then
    echo "✅ /voice-actors/test 엔드포인트 정상"
else
    echo "❌ /voice-actors/test 엔드포인트 접근 불가"
fi

# 5. 프론트엔드 설정 확인
echo -e "\n5️⃣ 프론트엔드 설정 확인 중..."
FRONTEND_ENV="/home/jun/projects/ment-creator/frontend/ment-gen/.env.local"
if [ -f "$FRONTEND_ENV" ]; then
    API_URL=$(grep "NEXT_PUBLIC_API_BASE_URL" "$FRONTEND_ENV" | cut -d'=' -f2)
    echo "✅ 프론트엔드 API URL: $API_URL"
else
    echo "❌ 프론트엔드 .env.local 파일이 없습니다."
fi

echo -e "\n📋 해결 방법:"
echo "1. 백엔드 서버가 실행되지 않은 경우:"
echo "   cd /home/jun/projects/ment-creator/backend"
echo "   ./start_server.sh"
echo ""
echo "2. 데이터가 없는 경우:"
echo "   python3 test_api_data.py"
echo ""
echo "3. 프론트엔드에서 테스트:"
echo "   브라우저에서 http://localhost:3000/ars-ment-management/list 접속"
echo "   개발자 도구에서 네트워크 탭 확인"

echo -e "\n✅ 진단 완료"
