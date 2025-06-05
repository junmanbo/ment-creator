#!/bin/bash

# 작업 디렉터리를 backend로 변경
cd /home/jun/projects/ment-creator/backend

echo "현재 alembic 상태 확인..."
.venv/bin/alembic current

echo "새로운 마이그레이션 생성..."
.venv/bin/alembic revision --autogenerate -m "Fix voice_settings JSON type for scenario_tts"

echo "마이그레이션 실행..."
.venv/bin/alembic upgrade head

echo "완료!"
