#!/bin/bash

# 🚀 ARS 시나리오 관리 시스템 빠른 실행 스크립트

echo "🎯 ARS 시나리오 관리 시스템 실행 중..."
echo ""

# 터미널 창 분할을 위한 tmux 사용 (있는 경우)
if command -v tmux &> /dev/null; then
    echo "🖥️ tmux를 사용하여 백엔드와 프론트엔드를 동시 실행합니다"
    
    # tmux 세션 생성
    tmux new-session -d -s ars-system
    
    # 백엔드 실행
    tmux send-keys -t ars-system "cd backend && echo '🐍 백엔드 API 서버 시작...' && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" Enter
    
    # 창 분할 및 프론트엔드 실행
    tmux split-window -t ars-system -h
    tmux send-keys -t ars-system "cd frontend/ment-gen && echo '⚛️ 프론트엔드 개발 서버 시작...' && npm run dev" Enter
    
    # tmux 세션에 연결
    echo "⏳ 서버 시작 대기 중... (5초)"
    sleep 5
    echo ""
    echo "🌐 접속 주소:"
    echo "  - API 문서: http://localhost:8000/docs"
    echo "  - 웹 애플리케이션: http://localhost:3000"
    echo ""
    echo "🎮 tmux 조작법:"
    echo "  - Ctrl+B, 방향키: 창 이동"
    echo "  - Ctrl+B, D: 세션에서 나가기 (백그라운드 실행)"
    echo "  - tmux attach -t ars-system: 세션 다시 연결"
    echo "  - tmux kill-session -t ars-system: 세션 종료"
    echo ""
    tmux attach -t ars-system
    
else
    echo "⚠️ tmux가 설치되지 않았습니다. 수동으로 실행하세요:"
    echo ""
    echo "📱 터미널 1 - 백엔드:"
    echo "  cd backend"
    echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    echo "⚛️ 터미널 2 - 프론트엔드:"
    echo "  cd frontend/ment-gen"
    echo "  npm run dev"
    echo ""
    echo "🌐 접속 주소:"
    echo "  - API 문서: http://localhost:8000/docs"
    echo "  - 웹 애플리케이션: http://localhost:3000"
fi
