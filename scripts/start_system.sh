#!/bin/bash

# 전체 시스템 시작 스크립트
echo "🚀 ARS 시나리오 관리 시스템을 시작합니다..."
echo "========================================"

# 스크립트 실행 권한 부여
chmod +x /home/jun/projects/ment-creator/scripts/start_backend.sh
chmod +x /home/jun/projects/ment-creator/scripts/start_frontend.sh

# 터미널 창을 나누어 실행하기 위한 함수
start_backend() {
    echo "🔧 백엔드 서버 시작..."
    gnome-terminal --tab --title="Backend Server" -- bash -c "
        cd /home/jun/projects/ment-creator/scripts
        ./start_backend.sh
        exec bash
    " &
}

start_frontend() {
    echo "🎨 프론트엔드 서버 시작..."
    gnome-terminal --tab --title="Frontend Server" -- bash -c "
        cd /home/jun/projects/ment-creator/scripts  
        ./start_frontend.sh
        exec bash
    " &
}

# 실행 선택
echo "다음 중 하나를 선택하세요:"
echo "1. 백엔드만 실행"
echo "2. 프론트엔드만 실행" 
echo "3. 전체 시스템 실행"
echo "4. 수동 실행 가이드 보기"
read -p "선택 (1-4): " choice

case $choice in
    1)
        echo "🔧 백엔드 서버만 시작합니다..."
        cd /home/jun/projects/ment-creator/scripts
        ./start_backend.sh
        ;;
    2)
        echo "🎨 프론트엔드 서버만 시작합니다..."
        cd /home/jun/projects/ment-creator/scripts
        ./start_frontend.sh
        ;;
    3)
        echo "🌐 전체 시스템을 시작합니다..."
        start_backend
        sleep 3
        start_frontend
        echo "✅ 서버들이 별도 터미널에서 실행되었습니다."
        echo "📍 백엔드: http://localhost:8000"
        echo "📍 프론트엔드: http://localhost:3000"
        ;;
    4)
        echo ""
        echo "📋 수동 실행 가이드:"
        echo "========================================"
        echo "🔧 백엔드 실행:"
        echo "cd /home/jun/projects/ment-creator/backend"
        echo "source .venv/bin/activate"
        echo "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
        echo ""
        echo "🎨 프론트엔드 실행:"
        echo "cd /home/jun/projects/ment-creator/frontend/ment-gen"
        echo "npm run dev"
        echo ""
        echo "📍 접속 주소:"
        echo "- 백엔드 API: http://localhost:8000"
        echo "- 프론트엔드: http://localhost:3000"
        echo "- API 문서: http://localhost:8000/docs"
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac
