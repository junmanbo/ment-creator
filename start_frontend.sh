#!/bin/bash

echo "🎨 ARS 시나리오 관리 시스템 프론트엔드 서버 시작"
echo "============================================="

cd frontend/ment-gen

# Node.js 의존성 확인
if [ ! -d "node_modules" ]; then
    echo "📦 의존성 설치 중..."
    npm install
else
    echo "✅ 의존성이 이미 설치되어 있습니다."
fi

# 환경변수 확인
if [ ! -f ".env.local" ]; then
    echo "⚠️ .env.local 파일이 없습니다. 기본 설정을 사용합니다."
fi

echo "🌐 Next.js 개발 서버 시작 중... (http://localhost:3000)"
echo ""
echo "📱 애플리케이션 주소:"
echo "   - 메인 페이지: http://localhost:3000"
echo "   - 로그인 페이지: http://localhost:3000/login"
echo "   - 성우 관리: http://localhost:3000/voice-actors"
echo ""
echo "🛑 서버를 중지하려면 Ctrl+C를 누르세요"

npm run dev
