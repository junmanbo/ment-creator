#!/bin/bash

# 백엔드 서버 시작 스크립트
echo "🚀 Starting backend server..."
echo "📍 Current directory: $(pwd)"

# 가상환경 활성화
if [ -d ".venv" ]; then
    echo "🔧 Activating virtual environment..."
    source .venv/bin/activate
else
    echo "❌ Virtual environment not found"
    exit 1
fi

# 환경변수 확인
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "⚠️ .env file not found"
fi

# 서버 실행
echo "🎯 Starting FastAPI server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level info
