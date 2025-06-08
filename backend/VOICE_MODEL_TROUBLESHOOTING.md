# 🔧 Voice Model 생성 문제 해결 가이드

## 📊 현재 Voice Model 시스템 분석

### 🎯 Voice Model 생성 알고리즘
**현재 구현된 방식:**
- **Coqui XTTS v2** 모델 사용
- **Voice Cloning** 방식 (Fine-tuning 아님)
- **참조 음성 기반**: 성우의 샘플들을 TTS 생성 시 참조
- **다국어 지원**: 한국어 포함

### 🔍 문제 진단 방법

#### 1. 즉시 진단 API 사용
```bash
# TTS 환경 전체 진단
curl -X GET "http://localhost:8000/api/v1/voice-actors/debug/diagnosis" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. 자동 문제 해결
```bash
# 일반적인 문제들 자동 수정
curl -X POST "http://localhost:8000/api/v1/voice-actors/debug/fix-issues" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. 디버그 모드 학습
```bash
# 특정 모델을 디버그 모드로 학습 (동기 실행으로 오류 즉시 확인)
curl -X POST "http://localhost:8000/api/v1/voice-actors/models/{model_id}/debug-train" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🛠️ 단계별 문제 해결

### Step 1: TTS 의존성 확인 및 설치

#### Python 환경에서 확인
```bash
cd backend
source .venv/bin/activate  # 가상환경 활성화

# 테스트 스크립트 실행
python test_tts_setup.py
```

#### 의존성 수동 설치 (문제 발생 시)
```bash
# uv 사용 (권장)
uv add TTS torch torchaudio librosa soundfile

# 또는 pip 사용
pip install TTS torch torchaudio librosa soundfile
```

### Step 2: 디렉토리 구조 확인
```bash
# 필요한 디렉토리들 확인 및 생성
mkdir -p backend/audio_files
mkdir -p backend/voice_samples  
mkdir -p backend/voice_models

# 권한 확인
chmod 755 backend/audio_files
chmod 755 backend/voice_samples
chmod 755 backend/voice_models
```

### Step 3: Voice Model 생성 테스트

#### 3-1. 성우 등록 및 샘플 업로드
```bash
# 1. 성우 등록
curl -X POST "http://localhost:8000/api/v1/voice-actors/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 성우",
    "gender": "female", 
    "age_range": "30s",
    "description": "테스트용 성우"
  }'

# 2. 음성 샘플 업로드
curl -X POST "http://localhost:8000/api/v1/voice-actors/{voice_actor_id}/samples" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio_file=@sample.wav" \
  -F "text_content=안녕하세요. 테스트 샘플입니다."
```

#### 3-2. Voice Model 생성 및 학습
```bash
# 1. Voice Model 생성
curl -X POST "http://localhost:8000/api/v1/voice-actors/models" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "voice_actor_id": "YOUR_VOICE_ACTOR_ID",
    "model_name": "테스트 모델 v1.0"
  }'

# 2. 디버그 모드 학습 시작
curl -X POST "http://localhost:8000/api/v1/voice-actors/models/{model_id}/debug-train" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚨 일반적인 문제들과 해결방안

### 문제 1: TTS 라이브러리 Import 실패
**증상:** `ImportError: No module named 'TTS'`

**해결방안:**
```bash
# 의존성 재설치
uv sync --reinstall
# 또는
pip install --force-reinstall TTS torch torchaudio
```

### 문제 2: GPU 관련 오류
**증상:** CUDA 관련 오류 메시지

**해결방안:**
```bash
# CPU 모드로 강제 실행
export CUDA_VISIBLE_DEVICES=""
# 또는 환경변수 설정
echo "CUDA_VISIBLE_DEVICES=" >> .env
```

### 문제 3: 디렉토리 권한 문제
**증상:** Permission denied 오류

**해결방안:**
```bash
# 권한 수정
sudo chown -R $USER:$USER backend/voice_*
chmod -R 755 backend/voice_*
```

### 문제 4: 모델이 TRAINING 상태에서 멈춤
**증상:** 모델 상태가 "training"에서 변경되지 않음

**해결방안:**
```bash
# 자동 수정 API 사용
curl -X POST "http://localhost:8000/api/v1/voice-actors/debug/fix-issues" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 또는 수동으로 상태 리셋
curl -X PUT "http://localhost:8000/api/v1/voice-actors/models/{model_id}" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ready"}'
```

### 문제 5: 음성 샘플 파일 누락
**증상:** "Sample file not found" 오류

**해결방안:**
```bash
# 1. 샘플 파일 경로 확인
ls -la backend/voice_samples/

# 2. 샘플 재업로드
curl -X POST "http://localhost:8000/api/v1/voice-actors/{voice_actor_id}/samples" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio_file=@your_sample.wav" \
  -F "text_content=샘플 텍스트"
```

## 🔄 Mock TTS 모드 활용

TTS 라이브러리 설치에 문제가 있는 경우, Mock 모드로 개발을 계속할 수 있습니다:

### Mock 모드 특징
- **실제 TTS 없이 개발 가능**
- **더미 음성 파일 생성** (sine wave)
- **전체 플로우 테스트 가능**
- **품질 점수 시뮬레이션**

### Mock 모드 확인
```bash
# 진단 API로 현재 모드 확인
curl -X GET "http://localhost:8000/api/v1/voice-actors/debug/diagnosis" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.diagnosis.dependencies.TTS'
```

## 📊 성능 최적화 팁

### 1. GPU 사용 (권장)
```bash
# GPU 상태 확인
nvidia-smi

# CUDA 설정 확인
python -c "import torch; print(torch.cuda.is_available())"
```

### 2. 메모리 최적화
```bash
# Docker에서 메모리 제한 설정
docker run --memory="4g" --memory-swap="4g" your_container
```

### 3. 배치 처리 활용
```bash
# 여러 TTS를 한 번에 생성
curl -X POST "http://localhost:8000/api/v1/voice-actors/tts-scripts/batch-generate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "script_ids": ["script1", "script2", "script3"],
    "force_regenerate": false
  }'
```

## 🎯 프로덕션 배포 고려사항

### 1. GPU 인스턴스 사용
- **AWS p3.2xlarge** 또는 **Google Cloud GPU 인스턴스** 권장
- **CUDA 11.8+** 환경 구성

### 2. 스토리지 관리
```bash
# 생성된 파일들 정기 정리
find backend/audio_files -type f -mtime +30 -delete
```

### 3. 모니터링 설정
```bash
# 정기 헬스체크
curl -X GET "http://localhost:8000/api/v1/voice-actors/debug/diagnosis" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  >> health_check.log
```

## 🆘 추가 지원

### 로그 확인
```bash
# TTS 관련 로그 확인
grep -i "tts\|voice" backend/logs/app.log

# 에러 로그만 확인
grep -i "error\|failed" backend/logs/app.log | grep -i "tts\|voice"
```

### 개발 환경에서 직접 테스트
```bash
# Python 인터프리터에서 직접 테스트
cd backend
python -c "
from app.services.tts_service import tts_service
import asyncio
asyncio.run(tts_service.initialize_tts_model())
print('TTS 초기화 성공!')
"
```

이 가이드를 통해 Voice Model 생성 문제를 체계적으로 해결할 수 있습니다. 문제가 지속되면 진단 API 결과를 공유해주세요.
