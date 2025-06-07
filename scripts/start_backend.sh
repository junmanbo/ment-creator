#!/bin/bash

# 백엔드 서버 시작 스크립트
echo "🚀 백엔드 서버를 시작합니다..."

# 백엔드 디렉토리로 이동
cd /home/jun/projects/ment-creator/backend

# 가상환경 확인 및 활성화
if [ ! -d ".venv" ]; then
    echo "❌ 가상환경이 없습니다. uv venv로 생성해주세요."
    exit 1
fi

source .venv/bin/activate
echo "✅ 가상환경 활성화 완료"

# 의존성 확인
echo "📦 의존성 확인 중..."
uv sync

# 데이터베이스 마이그레이션 (필요시)
echo "🗄️ 데이터베이스 마이그레이션 확인..."
alembic upgrade head

# 서버 실행
echo "🌐 FastAPI 서버를 실행합니다..."
echo "📍 접속 주소: http://localhost:8000"
echo "📍 API 문서: http://localhost:8000/docs"
echo "📍 API 스키마: http://localhost:8000/api/v1/openapi.json"
echo ""
echo "서버를 중지하려면 Ctrl+C를 누르세요."
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
