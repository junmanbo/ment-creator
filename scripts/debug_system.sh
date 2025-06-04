#!/bin/bash

# 🔧 ARS 시나리오 관리 시스템 문제 해결 스크립트

echo "🔧 ARS 시스템 진단 및 문제 해결"
echo "=================================="
echo ""

# 1. 시스템 상태 체크
echo "📊 1. 시스템 상태 체크"
echo "--------------------"

# PostgreSQL 연결 확인
echo "🗄️ PostgreSQL 상태:"
if command -v psql &> /dev/null; then
    if psql $DATABASE_URL -c "SELECT 1;" &> /dev/null; then
        echo "  ✅ PostgreSQL 연결 성공"
    else
        echo "  ❌ PostgreSQL 연결 실패"
        echo "  💡 해결방법: PostgreSQL 서버가 실행 중인지 확인하고 DATABASE_URL을 점검하세요"
    fi
else
    echo "  ⚠️ psql 명령어를 찾을 수 없습니다"
fi

# Python 의존성 확인
echo ""
echo "🐍 Python 환경:"
cd backend 2>/dev/null || echo "❌ backend 디렉토리를 찾을 수 없습니다"
if python -c "import fastapi, sqlmodel, alembic" 2>/dev/null; then
    echo "  ✅ Python 의존성 설치됨"
else
    echo "  ❌ Python 의존성 누락"
    echo "  💡 해결방법: pip install fastapi sqlmodel alembic"
fi

# Node.js 의존성 확인
echo ""
echo "⚛️ Node.js 환경:"
cd ../frontend/ment-gen 2>/dev/null || echo "❌ frontend 디렉토리를 찾을 수 없습니다"
if [ -d "node_modules" ]; then
    echo "  ✅ Node.js 의존성 설치됨"
else
    echo "  ❌ Node.js 의존성 누락"
    echo "  💡 해결방법: npm install 또는 yarn install"
fi

cd ../..

# 2. 마이그레이션 상태 확인
echo ""
echo "🔄 2. 데이터베이스 마이그레이션 상태"
echo "------------------------------------"
cd backend
alembic current 2>/dev/null || echo "❌ 마이그레이션 히스토리를 확인할 수 없습니다"
echo ""
echo "📋 사용 가능한 마이그레이션:"
alembic history --verbose 2>/dev/null || echo "❌ 마이그레이션 목록을 확인할 수 없습니다"

# 3. 포트 사용 확인
echo ""
echo "🌐 3. 포트 사용 상태"
echo "------------------"
echo "포트 8000 (백엔드):"
if lsof -i :8000 &> /dev/null; then
    echo "  ⚠️ 포트 8000이 이미 사용 중입니다"
    lsof -i :8000
else
    echo "  ✅ 포트 8000 사용 가능"
fi

echo ""
echo "포트 3000 (프론트엔드):"
if lsof -i :3000 &> /dev/null; then
    echo "  ⚠️ 포트 3000이 이미 사용 중입니다"
    lsof -i :3000
else
    echo "  ✅ 포트 3000 사용 가능"
fi

# 4. 로그 확인
echo ""
echo "📝 4. 최근 로그"
echo "---------------"
if [ -f "logs/app.log" ]; then
    echo "🔍 최근 백엔드 로그 (마지막 10줄):"
    tail -10 logs/app.log
else
    echo "📄 백엔드 로그 파일이 없습니다"
fi

# 5. 자동 수정 옵션
echo ""
echo "🔧 5. 자동 수정 옵션"
echo "------------------"
echo "다음 중 실행할 작업을 선택하세요:"
echo "1) 데이터베이스 재설정 (모든 데이터 삭제)"
echo "2) Python 의존성 재설치"
echo "3) Node.js 의존성 재설치"
echo "4) 캐시 및 임시 파일 정리"
echo "5) 전체 시스템 재설정"
echo "0) 종료"
echo ""

read -p "선택 (0-5): " choice

case $choice in
    1)
        echo "🗄️ 데이터베이스 재설정 중..."
        alembic downgrade base
        alembic upgrade head
        python -c "
import asyncio
from app.initial_data import main
asyncio.run(main())
print('✅ 초기 데이터 생성 완료')
"
        echo "✅ 데이터베이스 재설정 완료"
        ;;
    2)
        echo "🐍 Python 의존성 재설치 중..."
        pip install --force-reinstall fastapi sqlmodel alembic asyncpg python-multipart python-jose passlib uvicorn
        echo "✅ Python 의존성 재설치 완료"
        ;;
    3)
        echo "⚛️ Node.js 의존성 재설치 중..."
        cd ../frontend/ment-gen
        rm -rf node_modules package-lock.json
        npm install
        cd ../../backend
        echo "✅ Node.js 의존성 재설치 완료"
        ;;
    4)
        echo "🧹 캐시 및 임시 파일 정리 중..."
        # Python 캐시 정리
        find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
        find . -name "*.pyc" -delete 2>/dev/null
        
        # Node.js 캐시 정리
        cd ../frontend/ment-gen
        rm -rf .next
        rm -rf node_modules/.cache
        cd ../../backend
        
        echo "✅ 캐시 정리 완료"
        ;;
    5)
        echo "🔄 전체 시스템 재설정 중..."
        echo "  이 작업은 시간이 걸릴 수 있습니다..."
        
        # 데이터베이스 재설정
        alembic downgrade base
        alembic upgrade head
        
        # Python 의존성 재설치
        pip install --force-reinstall fastapi sqlmodel alembic asyncpg python-multipart python-jose passlib uvicorn
        
        # Node.js 의존성 재설치
        cd ../frontend/ment-gen
        rm -rf node_modules package-lock.json .next
        npm install
        cd ../../backend
        
        # 초기 데이터 생성
        python -c "
import asyncio
from app.initial_data import main
asyncio.run(main())
print('✅ 초기 데이터 생성 완료')
"
        
        echo "✅ 전체 시스템 재설정 완료"
        ;;
    0)
        echo "👋 종료합니다"
        ;;
    *)
        echo "❌ 잘못된 선택입니다"
        ;;
esac

cd ..

echo ""
echo "🎯 문제가 계속 발생하는 경우:"
echo "  1. .env 파일의 설정을 확인하세요"
echo "  2. PostgreSQL 서버가 실행 중인지 확인하세요"
echo "  3. 방화벽이 포트를 차단하지 않는지 확인하세요"
echo "  4. 디스크 공간이 충분한지 확인하세요"
echo ""
echo "📞 추가 지원이 필요하면 개발팀에 문의하세요"
