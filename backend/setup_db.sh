#!/bin/bash
# PostgreSQL 데이터베이스 설정 및 실행 스크립트

set -e

echo "=== PostgreSQL 데이터베이스 설정 시작 ==="

# 현재 디렉토리로 이동
cd /home/jun/projects/ment-creator/backend/db

echo "1. 기존 컨테이너 정리..."
docker-compose down || true

echo "2. PostgreSQL 컨테이너 실행..."
docker-compose up -d

echo "3. 컨테이너 상태 확인..."
sleep 5
docker-compose ps

echo "4. PostgreSQL 연결 테스트 (최대 30초 대기)..."
for i in {1..30}; do
    if docker exec db pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL이 준비되었습니다!"
        break
    fi
    echo "⏳ PostgreSQL 시작 대기 중... ($i/30)"
    sleep 1
done

echo "5. 데이터베이스 확인..."
docker exec -it db psql -U postgres -d ment_creator -c "\l"

echo "=== PostgreSQL 설정 완료 ==="
echo "데이터베이스 접속 정보:"
echo "  호스트: localhost:5432"
echo "  사용자: postgres"
echo "  비밀번호: password"
echo "  데이터베이스: ment_creator"
