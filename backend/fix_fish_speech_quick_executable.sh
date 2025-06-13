#!/bin/bash
# Fish Speech 설치 문제 해결 스크립트

echo "🔍 Fish Speech 설치 상태 확인 중..."

# Fish Speech 디렉토리로 이동
cd /home/jun/projects/ment-creator/backend/fish_speech/fish-speech

# 가상환경 활성화
source .venv/bin/activate

echo "📦 현재 설치된 패키지 확인..."
python -c "import sys; print(f'Python 경로: {sys.executable}')"

echo "🔍 pyrootutils 설치 확인..."
python -c "import pyrootutils; print(f'pyrootutils 버전: {pyrootutils.__version__}')" 2>/dev/null || echo "❌ pyrootutils 미설치"

echo "🔧 pip 업그레이드..."
python -m pip install --upgrade pip

echo "🔧 pyrootutils 설치..."
pip install pyrootutils>=1.0.4

echo "🔧 Fish Speech 의존성 재설치..."
pip install -e .[stable]

echo "✅ 설치 완료. 재확인 중..."
python -c "import pyrootutils; print(f'✅ pyrootutils 설치 완료: {pyrootutils.__version__}')"
python -c "import fish_speech; print('✅ Fish Speech 모듈 로드 성공')"

echo "🎉 Fish Speech 설치 문제 해결 완료!"
