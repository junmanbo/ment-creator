#!/bin/bash

# TTS 기능 통합 테스트 및 개발 환경 시작 스크립트

set -e  # 오류 발생 시 스크립트 중단

echo "🚀 TTS 기능 통합 개발 환경 시작"
echo "=" * 60

# 현재 디렉토리 확인
if [ ! -f "backend/app/main.py" ]; then
    echo "❌ backend/app/main.py를 찾을 수 없습니다."
    echo "   프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

# 1. 백엔드 의존성 확인
echo "📦 백엔드 의존성 확인 중..."
cd backend

if [ ! -d ".venv" ]; then
    echo "❌ Python 가상환경이 없습니다. 생성 중..."
    python -m venv .venv
    echo "✅ 가상환경 생성 완료"
fi

echo "🔧 가상환경 활성화 및 의존성 설치..."
source .venv/bin/activate

# uv가 있으면 uv 사용, 없으면 pip 사용
if command -v uv &> /dev/null; then
    echo "📦 uv로 의존성 설치 중..."
    uv sync
else
    echo "📦 pip로 의존성 설치 중..."
    pip install -e .
fi

# 2. 데이터베이스 마이그레이션 확인
echo "🗄️  데이터베이스 마이그레이션 확인 중..."
if [ ! -f "alembic.ini" ]; then
    echo "❌ alembic.ini가 없습니다."
    exit 1
fi

# 마이그레이션 실행
echo "📊 마이그레이션 실행 중..."
alembic upgrade head
echo "✅ 마이그레이션 완료"

# 3. TTS 디렉토리 생성
echo "📁 TTS 관련 디렉토리 생성 중..."
mkdir -p audio_files
mkdir -p voice_samples
echo "✅ 디렉토리 생성 완료"

# 4. 백엔드 서버 시작 (백그라운드)
echo "🖥️  백엔드 서버 시작 중..."
echo "   주소: http://localhost:8000"
echo "   API 문서: http://localhost:8000/docs"

# 이미 실행 중인 서버가 있는지 확인
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "ℹ️  백엔드 서버가 이미 실행 중입니다."
else
    echo "🚀 새 백엔드 서버 시작..."
    # 백그라운드에서 서버 시작
    nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   PID: $BACKEND_PID"
    
    # 서버가 시작될 때까지 대기
    echo "⏳ 서버 시작 대기 중..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "✅ 백엔드 서버 시작 완료"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo
fi

cd ..

# 5. 프론트엔드 의존성 확인 및 시작
echo "🌐 프론트엔드 설정 중..."
cd frontend/ment-gen

if [ ! -d "node_modules" ]; then
    echo "📦 Node.js 의존성 설치 중..."
    npm install
    echo "✅ 의존성 설치 완료"
fi

# 환경 변수 확인
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local 파일이 없습니다. 생성 중..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=ARS 시나리오 관리 시스템
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_API_VERSION=v1
EOF
    echo "✅ 환경 변수 파일 생성 완료"
fi

# 프론트엔드 서버 시작 (백그라운드)
echo "🌐 프론트엔드 서버 시작 중..."
echo "   주소: http://localhost:3000"

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "ℹ️  프론트엔드 서버가 이미 실행 중입니다."
else
    echo "🚀 새 프론트엔드 서버 시작..."
    # 로그 디렉토리 생성
    mkdir -p ../../logs
    # 백그라운드에서 서버 시작
    nohup npm run dev > ../../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "   PID: $FRONTEND_PID"
    
    # 서버가 시작될 때까지 대기
    echo "⏳ 프론트엔드 서버 시작 대기 중..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ 프론트엔드 서버 시작 완료"
            break
        fi
        sleep 2
        echo -n "."
    done
    echo
fi

cd ../..

# 6. TTS API 테스트 실행
echo "🧪 TTS API 테스트 실행 중..."
echo "   아래 명령어로 수동 테스트를 실행할 수 있습니다:"
echo "   python test_tts_api.py"
echo

# 7. 완료 메시지
echo "=" * 60
echo "🎉 TTS 통합 개발 환경 시작 완료!"
echo
echo "📱 접속 주소:"
echo "   • 프론트엔드: http://localhost:3000"
echo "   • 백엔드 API: http://localhost:8000"
echo "   • API 문서: http://localhost:8000/docs"
echo
echo "🧪 테스트 방법:"
echo "   1. 수동 API 테스트: python test_tts_api.py"
echo "   2. 웹 브라우저에서 http://localhost:3000/voice-actors 접속"
echo "   3. TTS 생성 기능 테스트"
echo
echo "📋 주요 기능:"
echo "   • 성우 등록 및 관리"
echo "   • 음성 샘플 업로드"
echo "   • TTS 스크립트 생성"
echo "   • Voice Cloning TTS 생성"
echo "   • 오디오 파일 재생 및 다운로드"
echo "   • TTS 라이브러리 관리"
echo
echo "🛑 서버 중지:"
echo "   • 백엔드: pkill -f 'uvicorn app.main:app'"
echo "   • 프론트엔드: pkill -f 'npm run dev'"
echo
echo "📊 로그 확인:"
echo "   • 백엔드: tail -f logs/backend.log"
echo "   • 프론트엔드: tail -f logs/frontend.log"
echo "=" * 60
