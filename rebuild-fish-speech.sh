#!/bin/bash

echo "🧹 기존 Fish Speech 컨테이너 정리..."

# 기존 컨테이너 중지 및 제거
docker stop fish-speech-api-gpu 2>/dev/null || echo "컨테이너가 실행되지 않음"
docker rm fish-speech-api-gpu 2>/dev/null || echo "컨테이너가 존재하지 않음"

# 기존 이미지 제거 (선택사항)
echo "🔧 기존 이미지 제거..."
docker rmi ment-creator-fish-speech-gpu 2>/dev/null || echo "이미지가 존재하지 않음"

echo "🏗️ 새 Fish Speech 이미지 빌드..."
docker compose build fish-speech-gpu --no-cache

echo "🚀 Fish Speech 컨테이너 실행..."
docker compose up fish-speech-gpu -d

echo "📋 컨테이너 로그 확인..."
sleep 5
docker logs fish-speech-api-gpu

echo "✅ Fish Speech 복구 작업 완료!"
echo "📝 컨테이너 상태 확인: docker logs -f fish-speech-api-gpu"
echo "🌐 API 테스트: curl http://localhost:8765/health"
