#!/bin/bash

# 백엔드 간단 실행 및 테스트 스크립트

echo "🚀 Starting voice models debug test..."
echo "📍 Working directory: $(pwd)"

# 가상환경 활성화
if [ -f ".venv/bin/activate" ]; then
    echo "🔧 Activating virtual environment..."
    source .venv/bin/activate
else
    echo "❌ Virtual environment not found at .venv/bin/activate"
    exit 1
fi

echo "🐍 Python version: $(python --version)"
echo "📦 Checking dependencies..."

# 간단한 FastAPI 서버 실행 (백그라운드)
echo "🌐 Starting FastAPI server in background..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info > ../logs/backend.log 2>&1 &
SERVER_PID=$!

echo "🎯 Server PID: $SERVER_PID"
echo "⏰ Waiting for server to start..."
sleep 5

# 서버가 실행 중인지 확인
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server is running"
    
    # 디버깅용 엔드포인트 테스트
    echo "🧪 Testing debug endpoints..."
    
    # 1. 기본 테스트
    echo "1️⃣ Testing /voice-actors/api-test"
    curl -s http://localhost:8000/api/v1/voice-actors/api-test || echo "❌ Failed"
    
    # 2. 인증 없이 모델 디버그 API 테스트 (422 오류 확인)
    echo "2️⃣ Testing /voice-actors/models/debug (should fail without auth)"
    curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:8000/api/v1/voice-actors/models/debug || echo "❌ Failed"
    
    # 3. raw 모델 API 테스트
    echo "3️⃣ Testing /voice-actors/models/raw (should fail without auth)"  
    curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:8000/api/v1/voice-actors/models/raw || echo "❌ Failed"
    
    # 로그 확인
    echo "📋 Recent backend logs:"
    tail -20 ../logs/backend.log
    
    # 서버 종료
    echo "🛑 Stopping server..."
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
    
else
    echo "❌ Server failed to start"
    echo "📋 Backend logs:"
    cat ../logs/backend.log
fi

echo "✅ Test completed"
