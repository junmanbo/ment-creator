#!/bin/bash
# Fish Speech 설치 및 테스트 스크립트

set -e  # 오류 발생 시 스크립트 중단

echo "🐟 Fish Speech 설치 및 설정 시작..."

# 현재 디렉토리 확인
BACKEND_DIR=$(pwd)
echo "현재 디렉토리: $BACKEND_DIR"

# Python 환경 활성화
if [ -f ".venv/bin/activate" ]; then
    echo "Python 가상환경 활성화..."
    source .venv/bin/activate
else
    echo "❌ Python 가상환경을 찾을 수 없습니다. .venv/bin/activate가 있는지 확인하세요."
    exit 1
fi

# 1. Python 스크립트로 Fish Speech 설치
echo "1. Fish Speech 설치 중..."
python install_fish_speech.py

# 2. 의존성 업데이트
echo "2. 의존성 업데이트 중..."
uv sync

# 3. Fish Speech 디렉토리 확인
FISH_SPEECH_DIR="$BACKEND_DIR/fish_speech/fish-speech"
if [ ! -d "$FISH_SPEECH_DIR" ]; then
    echo "❌ Fish Speech 디렉토리가 없습니다: $FISH_SPEECH_DIR"
    exit 1
fi

echo "✅ Fish Speech 디렉토리 확인: $FISH_SPEECH_DIR"

# 4. 모델 다운로드 확인
MODEL_DIR="$FISH_SPEECH_DIR/checkpoints/openaudio-s1-mini"
if [ ! -d "$MODEL_DIR" ]; then
    echo "⬇️ OpenAudio S1-mini 모델 다운로드 중..."
    cd "$FISH_SPEECH_DIR"
    
    # Hugging Face CLI 설치
    pip install huggingface_hub[cli]
    
    # 모델 다운로드
    huggingface-cli download fishaudio/fish-speech-1.5 --local-dir checkpoints/openaudio-s1-mini
    
    cd "$BACKEND_DIR"
    echo "✅ 모델 다운로드 완료"
else
    echo "✅ 모델이 이미 존재합니다: $MODEL_DIR"
fi

# 5. Fish Speech API 서버 실행 테스트
echo "5. Fish Speech API 서버 실행 테스트..."
cd "$FISH_SPEECH_DIR"

# API 서버 백그라운드 실행
echo "API 서버 시작 중..."
python -m tools.api_server \
    --listen 127.0.0.1:8765 \
    --llama-checkpoint-path checkpoints/openaudio-s1-mini \
    --decoder-checkpoint-path checkpoints/openaudio-s1-mini/codec.pth \
    --decoder-config-name modded_dac_vq &

API_SERVER_PID=$!
echo "API 서버 PID: $API_SERVER_PID"

# 서버 준비 대기
echo "API 서버 준비 대기 중..."
sleep 30

# 서버 상태 확인
if curl -s http://127.0.0.1:8765/health > /dev/null 2>&1; then
    echo "✅ Fish Speech API 서버가 정상적으로 실행되고 있습니다!"
else
    echo "⚠️ API 서버 상태 확인 실패. 서버가 아직 준비 중일 수 있습니다."
fi

# 6. 간단한 TTS 테스트
echo "6. 간단한 TTS 테스트..."
TEST_TEXT="안녕하세요. 이것은 Fish Speech TTS 테스트입니다."
OUTPUT_FILE="$BACKEND_DIR/audio_files/fish_speech_test.wav"

# audio_files 디렉토리 생성
mkdir -p "$BACKEND_DIR/audio_files"

# 테스트 요청 (예시)
curl -X POST http://127.0.0.1:8765/tts \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$TEST_TEXT\",\"language\":\"ko\"}" \
    --output "$OUTPUT_FILE" \
    --max-time 60 || echo "⚠️ TTS 테스트 요청 실패 (정상적일 수 있음)"

# API 서버 종료
echo "API 서버 종료 중..."
kill $API_SERVER_PID || echo "API 서버 이미 종료됨"

cd "$BACKEND_DIR"

# 7. 백엔드 TTS 서비스 테스트
echo "7. 백엔드 TTS 서비스 테스트..."
python -c "
import asyncio
import sys
sys.path.append('.')

async def test_fish_speech():
    try:
        from app.services.fish_speech_tts_service import FishSpeechTTSService
        
        service = FishSpeechTTSService()
        print('✅ Fish Speech TTS 서비스 로드 성공')
        
        # 설치 확인
        if await service._check_fish_speech_installation():
            print('✅ Fish Speech 설치 확인 완료')
        else:
            print('❌ Fish Speech 설치 확인 실패')
            return False
            
        print('🎉 Fish Speech 준비 완료!')
        return True
        
    except Exception as e:
        print(f'❌ Fish Speech 서비스 테스트 실패: {e}')
        return False

result = asyncio.run(test_fish_speech())
sys.exit(0 if result else 1)
"

# 8. 팩토리 패턴 테스트
echo "8. TTS 팩토리 패턴 테스트..."
python -c "
import sys
sys.path.append('.')

try:
    from app.services.tts_factory import tts_factory, TTSEngine
    
    # 지원되는 엔진 확인
    engines = tts_factory.get_supported_engines()
    print(f'✅ 지원되는 TTS 엔진: {[e.value for e in engines]}')
    
    # Fish Speech 엔진 로드
    fish_service = tts_factory.get_tts_service(TTSEngine.FISH_SPEECH)
    print('✅ Fish Speech 엔진 로드 성공')
    
    # Coqui TTS 엔진 로드
    coqui_service = tts_factory.get_tts_service(TTSEngine.COQUI)
    print('✅ Coqui TTS 엔진 로드 성공')
    
    print('🎉 TTS 팩토리 패턴 테스트 완료!')
    
except Exception as e:
    print(f'❌ TTS 팩토리 테스트 실패: {e}')
    sys.exit(1)
"

echo ""
echo "🎉 Fish Speech 설치 및 설정 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 백엔드 서버 재시작: uvicorn app.main:app --reload"
echo "2. 프론트엔드에서 TTS 엔진 전환 테스트"
echo "3. /api/v1/tts-engines/ 엔드포인트 확인"
echo "4. /api/v1/voice-actors/test-tts 엔드포인트로 테스트"
echo ""
echo "🔧 설정:"
echo "- 기본 TTS 엔진: fish_speech (.env 파일에서 변경 가능)"
echo "- Fish Speech API: http://127.0.0.1:8765"
echo "- 모델 경로: $MODEL_DIR"
echo ""
echo "✅ 설치 완료!"
