#!/bin/bash
# PostgreSQL Docker 실행 스크립트

set -e

echo "=== PostgreSQL Docker 설정 ==="

cd /home/jun/projects/ment-creator/backend/db

echo "1. Docker 상태 확인..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되지 않았습니다."
    echo "Docker를 설치하고 다시 실행하세요."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose가 설치되지 않았습니다."
    echo "Docker Compose를 설치하고 다시 실행하세요."
    exit 1
fi

echo "2. 기존 컨테이너 정리..."
docker-compose down --volumes || true

echo "3. PostgreSQL 컨테이너 실행..."
docker-compose up -d

echo "4. 컨테이너 상태 확인..."
sleep 3
docker-compose ps

echo "5. PostgreSQL 준비 대기..."
echo "⏳ PostgreSQL이 시작될 때까지 기다리는 중..."
for i in {1..60}; do
    if docker exec db pg_isready -U postgres -q > /dev/null 2>&1; then
        echo "✅ PostgreSQL이 준비되었습니다!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ PostgreSQL 시작 대기 시간 초과"
        echo "컨테이너 로그를 확인하세요: docker-compose logs"
        exit 1
    fi
    sleep 1
done

echo "6. 데이터베이스 초기화..."
cd ../
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "🔄 Alembic 마이그레이션 실행..."
    alembic upgrade head
    
    echo "👤 슈퍼유저 생성..."
    python -c "
import asyncio
from app.initial_data import main as create_initial_data
try:
    asyncio.run(create_initial_data())
    print('✅ 슈퍼유저 생성 완료')
except Exception as e:
    print(f'⚠️ 슈퍼유저 생성 건너뛰기: {e}')
"
else
    echo "⚠️  가상환경이 없습니다. 수동으로 실행하세요:"
    echo "   source .venv/bin/activate"
    echo "   alembic upgrade head"
fi

echo ""
echo "=== PostgreSQL 설정 완료 ==="
echo "🎉 PostgreSQL이 성공적으로 실행되었습니다!"
echo ""
echo "📋 연결 정보:"
echo "  호스트: localhost:5432"
echo "  사용자: postgres"
echo "  비밀번호: password"
echo "  데이터베이스: ment_creator"
echo ""
echo "🚀 이제 백엔드 서버를 실행하세요:"
echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "🛑 PostgreSQL 중지:"
echo "  cd db && docker-compose down"
