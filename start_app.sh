#!/bin/bash

echo "🚀 ARS 시나리오 관리 시스템 전체 실행"
echo "====================================="

# 기본 서비스 확인
check_service() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1이 설치되지 않았습니다. 먼저 $1을 설치하세요."
        return 1
    fi
}

echo "🔍 필수 서비스 확인 중..."

# PostgreSQL 확인
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "⚠️ PostgreSQL이 실행되지 않았습니다."
    echo "   PostgreSQL을 시작하거나 Docker를 사용하세요:"
    echo "   sudo systemctl start postgresql"
    echo "   또는"
    echo "   docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15"
    echo ""
fi

# Redis 확인 (선택사항)
if ! redis-cli ping &> /dev/null; then
    echo "⚠️ Redis가 실행되지 않았습니다 (백그라운드 작업용)."
    echo "   Redis를 시작하거나 Docker를 사용하세요:"
    echo "   sudo systemctl start redis"
    echo "   또는"
    echo "   docker run --name redis -p 6379:6379 -d redis:7"
    echo ""
fi

# 실행 권한 부여
chmod +x start_backend.sh
chmod +x start_frontend.sh

echo "🎯 실행 옵션을 선택하세요:"
echo "1) 백엔드만 실행"
echo "2) 프론트엔드만 실행" 
echo "3) 백엔드 + 프론트엔드 동시 실행"
echo "4) 개발자 모드 (별도 터미널 창에서 실행)"

read -p "선택 (1-4): " choice

case $choice in
    1)
        echo "🔧 백엔드 서버만 실행합니다..."
        ./start_backend.sh
        ;;
    2)
        echo "🎨 프론트엔드 서버만 실행합니다..."
        ./start_frontend.sh
        ;;
    3)
        echo "🚀 백엔드와 프론트엔드를 동시에 실행합니다..."
        echo "   백엔드: http://localhost:8000"
        echo "   프론트엔드: http://localhost:3000"
        echo ""
        echo "🛑 모든 서버를 중지하려면 Ctrl+C를 누르세요"
        
        # 백그라운드에서 백엔드 실행
        ./start_backend.sh &
        BACKEND_PID=$!
        
        # 잠시 대기 후 프론트엔드 실행
        sleep 3
        ./start_frontend.sh &
        FRONTEND_PID=$!
        
        # 종료 시그널 처리
        trap "echo '🛑 서버들을 종료합니다...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
        
        # 대기
        wait
        ;;
    4)
        echo "🔧 개발자 모드: 별도 터미널에서 실행하세요"
        echo ""
        echo "터미널 1에서:"
        echo "  ./start_backend.sh"
        echo ""
        echo "터미널 2에서:"
        echo "  ./start_frontend.sh"
        echo ""
        echo "또는 VS Code에서 각각의 터미널에서 실행하세요."
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac
