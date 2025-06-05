#!/bin/bash

echo "🚀 ARS 시나리오 관리 시스템 백엔드 서버 시작"
echo "=========================================="

cd backend

# 가상환경 활성화
if [ -d ".venv" ]; then
    echo "📦 가상환경 활성화 중..."
    source .venv/bin/activate
else
    echo "❌ 가상환경을 찾을 수 없습니다. 먼저 uv를 사용하여 가상환경을 설정하세요."
    exit 1
fi

# 데이터베이스 마이그레이션 실행
echo "🗃️ 데이터베이스 마이그레이션 실행 중..."
alembic upgrade head

# 초기 데이터 생성 (필요시)
echo "🌱 초기 데이터 확인 중..."
python -c "
import asyncio
from app.initial_data import main
asyncio.run(main())
"

# FastAPI 서버 시작
echo "🌐 FastAPI 서버 시작 중... (http://localhost:8000)"
echo "📖 API 문서: http://localhost:8000/docs"
echo "📋 API 스키마: http://localhost:8000/redoc"
echo ""
echo "🛑 서버를 중지하려면 Ctrl+C를 누르세요"

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
