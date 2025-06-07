#!/bin/bash

# 프론트엔드 서버 시작 스크립트
echo "🎨 프론트엔드 서버를 시작합니다..."

# 프론트엔드 디렉토리로 이동
cd /home/jun/projects/ment-creator/frontend/ment-gen

# 의존성 확인
if [ ! -d "node_modules" ]; then
    echo "📦 의존성을 설치합니다..."
    npm install
else
    echo "✅ 의존성 확인 완료"
fi

# 서버 실행
echo "🌐 Next.js 서버를 실행합니다..."
echo "📍 접속 주소: http://localhost:3000"
echo ""
echo "서버를 중지하려면 Ctrl+C를 누르세요."
echo ""

npm run dev
