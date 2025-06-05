#!/bin/bash

# Multiple Heads 문제 간단 해결 스크립트
cd /home/jun/projects/ment-creator/backend

echo "🔧 Multiple Heads 문제 해결 중..."

echo "1️⃣ 모든 heads를 적용 중..."
.venv/bin/alembic upgrade heads

echo "2️⃣ Merge migration 생성 중..."
.venv/bin/alembic merge heads -m "Merge all heads"

echo "3️⃣ 최종 업그레이드 중..."
.venv/bin/alembic upgrade head

echo "4️⃣ 최종 상태 확인 중..."
.venv/bin/alembic current

echo "✅ 완료!"
