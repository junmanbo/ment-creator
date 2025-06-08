#!/bin/bash
# 빠른 SQLite 전환 스크립트

set -e

cd /home/jun/projects/ment-creator/backend

echo "=== SQLite로 빠른 전환 ==="

# 기존 .env 백업
if [ -f ".env" ]; then
    echo "1. 기존 .env 파일 백업..."
    cp .env .env.postgresql.backup
fi

# SQLite 설정으로 교체
echo "2. SQLite 설정으로 전환..."
cp .env.sqlite .env

echo "3. 기존 데이터베이스 파일 정리..."
rm -f ment_creator.db*

echo "4. Alembic 마이그레이션 실행..."
if [ -d ".venv" ]; then
    source .venv/bin/activate
    alembic upgrade head
    echo "✅ 마이그레이션 완료"
else
    echo "⚠️  가상환경이 없습니다. 수동으로 실행하세요:"
    echo "   source .venv/bin/activate"
    echo "   alembic upgrade head"
fi

echo "5. 슈퍼유저 생성..."
python -c "
import asyncio
from app.initial_data import main as create_initial_data
asyncio.run(create_initial_data())
" || echo "⚠️  슈퍼유저 생성 실패 - 서버 실행 후 수동 생성 필요"

echo ""
echo "=== SQLite 전환 완료 ==="
echo "데이터베이스: ment_creator.db (SQLite)"
echo "이제 백엔드 서버를 실행해보세요:"
echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "PostgreSQL로 돌아가려면:"
echo "  cp .env.postgresql.backup .env"
