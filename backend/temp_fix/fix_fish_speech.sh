#!/bin/bash
set -e

echo "🐟 Fish Speech 의존성 문제 해결 시작"

# Fish Speech 경로 설정
FISH_SPEECH_DIR="/home/jun/projects/ment-creator/backend/fish_speech/fish-speech"
FISH_PYTHON="$FISH_SPEECH_DIR/.venv/bin/python"
FISH_PIP="$FISH_SPEECH_DIR/.venv/bin/pip"

echo "📁 Fish Speech 디렉토리: $FISH_SPEECH_DIR"
echo "🐍 Python 경로: $FISH_PYTHON"

# 디렉토리 및 파일 존재 확인
if [ ! -d "$FISH_SPEECH_DIR" ]; then
    echo "❌ Fish Speech 디렉토리가 없습니다: $FISH_SPEECH_DIR"
    exit 1
fi

if [ ! -f "$FISH_PYTHON" ]; then
    echo "❌ Fish Speech Python 실행파일이 없습니다: $FISH_PYTHON"
    exit 1
fi

# Fish Speech 디렉토리로 이동
cd "$FISH_SPEECH_DIR"

echo ""
echo "1️⃣ pip 업그레이드..."
"$FISH_PYTHON" -m pip install --upgrade pip

echo ""
echo "2️⃣ wheel 및 setuptools 설치..."
"$FISH_PYTHON" -m pip install --upgrade wheel setuptools setuptools-scm

echo ""
echo "3️⃣ pyrootutils 직접 설치..."
"$FISH_PYTHON" -m pip install "pyrootutils>=1.0.4"

echo ""
echo "4️⃣ Fish Speech 의존성 재설치..."
"$FISH_PYTHON" -m pip install -e ".[stable]" --upgrade

echo ""
echo "5️⃣ 설치 확인..."

# pyrootutils 확인
echo "🔍 pyrootutils 확인..."
"$FISH_PYTHON" -c "import pyrootutils; print(f'✅ pyrootutils 버전: {pyrootutils.__version__}')"

# fish_speech 확인 (실패해도 계속 진행)
echo "🔍 fish_speech 확인..."
if "$FISH_PYTHON" -c "import fish_speech; print('✅ fish_speech 모듈 로드 성공')" 2>/dev/null; then
    echo "✅ fish_speech 모듈 로드 성공"
else
    echo "⚠️  fish_speech 모듈 로드 실패, 하지만 API 서버는 실행 가능할 수 있습니다"
fi

echo ""
echo "6️⃣ 중요 패키지 확인..."
"$FISH_PYTHON" -c "
try:
    import pyrootutils
    print(f'✅ pyrootutils: {pyrootutils.__version__}')
except ImportError as e:
    print(f'❌ pyrootutils: {e}')

try:
    import torch
    print(f'✅ torch: {torch.__version__}')
except ImportError as e:
    print(f'❌ torch: {e}')

try:
    import transformers
    print(f'✅ transformers: {transformers.__version__}')
except ImportError as e:
    print(f'❌ transformers: {e}')
"

echo ""
echo "🎉 Fish Speech 의존성 문제 해결 완료!"
echo "이제 다시 Fish Speech API 서버를 실행해보세요."
echo ""
echo "실행 명령어:"
echo "uv run python start_fish_speech_server.py start"
