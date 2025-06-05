#!/bin/bash

# 안전한 마이그레이션 실행 스크립트
cd /home/jun/projects/ment-creator/backend

echo "🔍 현재 데이터베이스 상태 확인 중..."

# 현재 마이그레이션 상태
echo "1️⃣ 현재 마이그레이션 상태:"
.venv/bin/alembic current

# ScenarioVersion 테이블 구조 확인 (가능하면)
echo "2️⃣ 데이터베이스 스키마 확인 시도..."
.venv/bin/python -c "
import os
import sys
sys.path.append('.')

try:
    from app.core.config import settings
    from sqlmodel import create_engine, text
    
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    with engine.connect() as conn:
        # Check if parent_version_id column exists
        result = conn.execute(text('''
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'scenarioversion' 
            AND column_name = 'parent_version_id'
        '''))
        
        if result.fetchone():
            print('✅ parent_version_id 컬럼이 이미 존재함')
        else:
            print('❌ parent_version_id 컬럼이 존재하지 않음 - 추가 필요')
            
        # Check foreign key constraints
        result = conn.execute(text('''
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'scenarioversion' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%parent_version%'
        '''))
        
        if result.fetchone():
            print('✅ parent_version foreign key constraint가 이미 존재함')
        else:
            print('❌ parent_version foreign key constraint가 존재하지 않음 - 추가 필요')
            
except Exception as e:
    print(f'⚠️ 데이터베이스 연결 실패 (정상적일 수 있음): {e}')
"

echo "3️⃣ 마이그레이션 실행 중..."
.venv/bin/alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ 마이그레이션 성공!"
    
    echo "4️⃣ 최종 상태 확인:"
    .venv/bin/alembic current
    
    echo "5️⃣ 모델 관계 테스트 실행:"
    cd ..
    PYTHONPATH=/home/jun/projects/ment-creator/backend python3 -c "
import sys
sys.path.insert(0, '/home/jun/projects/ment-creator/backend')

try:
    print('🧪 SQLModel 관계 테스트...')
    from sqlalchemy.orm import configure_mappers
    import app.models
    configure_mappers()
    print('✅ SQLModel 관계 테스트 성공!')
except Exception as e:
    print(f'❌ SQLModel 관계 테스트 실패: {e}')
"
else
    echo "❌ 마이그레이션 실패!"
    echo "에러를 확인하고 수동으로 해결해야 합니다."
fi
