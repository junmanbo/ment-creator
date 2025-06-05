#!/bin/bash

# Self-referential relationship 수정을 위한 마이그레이션 생성 및 적용
cd /home/jun/projects/ment-creator/backend

echo "🔧 Self-referential relationship 마이그레이션 생성 중..."

# 새로운 마이그레이션 생성
.venv/bin/alembic revision --autogenerate -m "Add self-referential foreign key to ScenarioVersion.parent_version_id"

echo "📊 생성된 마이그레이션 확인 중..."
.venv/bin/alembic history | head -10

echo "🚀 마이그레이션 적용 중..."
.venv/bin/alembic upgrade head

echo "✅ 완료! 현재 상태:"
.venv/bin/alembic current

echo "🧪 모델 관계 테스트 실행 중..."
cd ..
python test_model_fix.py
