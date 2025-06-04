#!/bin/bash

# 🚀 ARS 시나리오 관리 시스템 설정 및 실행 스크립트

echo "=========================================="
echo "🎯 ARS 시나리오 관리 시스템 설정 시작"
echo "=========================================="
echo ""

# 1. 환경 변수 확인
echo "📋 1. 환경 변수 확인"
if [ ! -f ".env" ]; then
    echo "❌ .env 파일이 없습니다!"
    echo "📝 .env 파일을 생성하세요:"
    echo ""
    cat << EOF
# 데이터베이스 설정
DATABASE_URL=postgresql://postgres:password@localhost:5432/insurance_ars
POSTGRES_DB=insurance_ars
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# JWT 설정
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# API 설정
API_V1_STR=/api/v1
PROJECT_NAME="ARS 시나리오 관리 시스템"

# TTS 설정
TTS_MODEL_CACHE_DIR=./tts_models
AUDIO_FILES_DIR=./audio_files
VOICE_SAMPLES_DIR=./voice_samples

# 프론트엔드 설정
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
EOF
    exit 1
else
    echo "✅ .env 파일 확인됨"
fi

# 2. Python 가상환경 및 의존성 설치
echo ""
echo "🐍 2. Python 백엔드 설정"
cd backend

echo "📦 의존성 설치 중..."
if command -v uv &> /dev/null; then
    echo "🚀 uv를 사용하여 의존성 설치"
    uv install
else
    echo "📋 pip을 사용하여 의존성 설치"
    python -m pip install --upgrade pip
    pip install -r requirements.txt 2>/dev/null || pip install fastapi sqlmodel alembic asyncpg python-multipart python-jose passlib uvicorn
fi

# 3. 데이터베이스 설정
echo ""
echo "🗄️ 3. 데이터베이스 설정"

# PostgreSQL Docker 컨테이너 시작 (있는 경우)
if [ -f "db/docker-compose.yml" ]; then
    echo "🐳 PostgreSQL Docker 컨테이너 시작"
    cd db
    docker-compose up -d
    cd ..
    echo "⏳ 데이터베이스 시작 대기..."
    sleep 5
else
    echo "⚠️ PostgreSQL이 실행 중인지 확인하세요"
fi

# 4. 데이터베이스 마이그레이션
echo ""
echo "🔄 4. 데이터베이스 마이그레이션 실행"

echo "📋 현재 마이그레이션 상태 확인"
alembic current || echo "마이그레이션 히스토리 없음"

echo "🔼 최신 마이그레이션 적용"
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ 마이그레이션 완료"
else
    echo "❌ 마이그레이션 실패"
    echo "💡 해결 방법:"
    echo "  1. PostgreSQL이 실행 중인지 확인"
    echo "  2. DATABASE_URL이 올바른지 확인"
    echo "  3. 데이터베이스가 존재하는지 확인"
    exit 1
fi

# 5. 초기 데이터 생성
echo ""
echo "👤 5. 초기 사용자 데이터 생성"
python -c "
import asyncio
from app.initial_data import main
asyncio.run(main())
print('✅ 초기 데이터 생성 완료')
" || echo "⚠️ 초기 데이터 생성 실패 (이미 존재할 수 있음)"

cd ..

# 6. Node.js 프론트엔드 설정
echo ""
echo "⚛️ 6. React 프론트엔드 설정"
cd frontend/ment-gen

echo "📦 프론트엔드 의존성 설치"
if command -v yarn &> /dev/null; then
    echo "🧶 yarn 사용"
    yarn install
else
    echo "📦 npm 사용"
    npm install
fi

cd ../..

# 7. 오디오 디렉토리 생성
echo ""
echo "📁 7. 오디오 디렉토리 생성"
mkdir -p backend/audio_files
mkdir -p backend/voice_samples
mkdir -p backend/tts_models
echo "✅ 오디오 디렉토리 생성 완료"

# 8. 완료 메시지
echo ""
echo "=========================================="
echo "🎉 설정 완료!"
echo "=========================================="
echo ""
echo "🚀 서버 시작 방법:"
echo ""
echo "📱 백엔드 API 서버:"
echo "  cd backend"
echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "⚛️ 프론트엔드 개발 서버:"
echo "  cd frontend/ment-gen"
echo "  npm run dev"
echo ""
echo "🌐 접속 주소:"
echo "  - API 문서: http://localhost:8000/docs"
echo "  - 웹 애플리케이션: http://localhost:3000"
echo ""
echo "📚 기본 로그인 정보:"
echo "  - 이메일: admin@example.com"
echo "  - 비밀번호: admin123"
echo ""
echo "🎯 주요 기능:"
echo "  ✅ 사용자 인증 및 관리"
echo "  ✅ ARS 시나리오 생성 및 편집"
echo "  ✅ React Flow 기반 플로우차트 에디터"
echo "  ✅ 성우 관리 및 TTS 생성"
echo "  ✅ 시나리오 버전 관리"
echo "  ✅ 상태 관리 및 배포 시스템"
echo ""
echo "🔧 문제 해결:"
echo "  - 로그 확인: backend/logs/"
echo "  - 데이터베이스 재설정: alembic downgrade base && alembic upgrade head"
echo "  - 캐시 초기화: rm -rf frontend/ment-gen/.next"
