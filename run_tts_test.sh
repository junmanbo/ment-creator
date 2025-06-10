#!/bin/bash

echo "🚀 TTS 진단 테스트 시작..."
echo "현재 디렉토리: $(pwd)"
echo "Python 버전: $(python3 --version)"

cd /home/jun/projects/ment-creator/backend

# 가상환경 활성화
if [ -d ".venv" ]; then
    echo "가상환경 활성화 중..."
    source .venv/bin/activate
    echo "활성화된 Python: $(which python)"
    echo "Python 버전: $(python --version)"
else
    echo "⚠️ 가상환경을 찾을 수 없습니다. 시스템 Python 사용"
fi

# 의존성 설치 확인
echo ""
echo "=== 의존성 확인 ==="
python -c "import torch; print(f'PyTorch: {torch.__version__}')" 2>/dev/null && echo "✅ PyTorch 설치됨" || echo "❌ PyTorch 설치 안됨"
python -c "import torchaudio; print(f'TorchAudio: {torchaudio.__version__}')" 2>/dev/null && echo "✅ TorchAudio 설치됨" || echo "❌ TorchAudio 설치 안됨"
python -c "import TTS; print(f'TTS: {getattr(TTS, \"__version__\", \"unknown\")}')" 2>/dev/null && echo "✅ TTS 설치됨" || echo "❌ TTS 설치 안됨"

# TTS 테스트 실행
echo ""
echo "=== TTS 진단 테스트 실행 ==="
python test_tts_standalone.py

echo ""
echo "테스트 완료!"
