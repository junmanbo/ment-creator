#!/bin/bash

# 현재 디렉터리 저장
ORIGINAL_DIR=$(pwd)

# backend 디렉터리로 이동
cd /home/jun/projects/ment-creator/backend

echo "=== Alembic 마이그레이션 실행 ==="
echo "현재 디렉터리: $(pwd)"

echo "1. 현재 alembic 상태 확인..."
.venv/bin/python -m alembic current

echo "2. 마이그레이션 히스토리 확인..."
.venv/bin/python -m alembic history

echo "3. 마이그레이션 실행..."
.venv/bin/python -m alembic upgrade head

echo "4. 최종 상태 확인..."
.venv/bin/python -m alembic current

# 원래 디렉터리로 복원
cd "$ORIGINAL_DIR"

echo "=== 완료 ==="
