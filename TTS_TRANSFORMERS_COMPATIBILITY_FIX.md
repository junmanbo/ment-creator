# 🚨 TTS 생성 오류 해결 가이드

## 문제 상황

TTS 멘트 생성 시 다음과 같은 오류가 발생했습니다:

```
ERROR: Voice Cloning 실패: 'GPT2InferenceModel' object has no attribute 'generate'
```

## 원인 분석

이 오류는 **Hugging Face Transformers 라이브러리 v4.50+ 버전 변경**으로 인해 발생했습니다.

### 주요 변경사항
1. **Transformers v4.50+**: `GPT2InferenceModel`에서 `generate` 메서드 제거
2. **PyTorch v2.6+**: `torch.load`의 `weights_only` 기본값이 `True`로 변경

### 경고 메시지
```
GPT2InferenceModel has generative capabilities... From 👉v4.50👈 onwards, 
PreTrainedModel will NOT inherit from GenerationMixin, and this model will lose 
the ability to call generate
```

## 🔧 해결 방법

### 방법 1: 자동 해결 스크립트 실행 (권장)

```bash
cd backend
python fix_pytorch_compatibility.py
```

이 스크립트는:
- 현재 설치된 라이브러리 버전 확인
- 호환성 문제 진단  
- 자동 다운그레이드 옵션 제공

### 방법 2: 수동 의존성 다운그레이드

**uv 사용:**
```bash
cd backend
uv add 'torch>=2.0.0,<2.6.0' 'torchaudio>=2.0.0,<2.6.0' 'transformers>=4.21.0,<4.50.0'
```

**pip 사용:**
```bash
cd backend
pip install 'torch>=2.0.0,<2.6.0' 'torchaudio>=2.0.0,<2.6.0' 'transformers>=4.21.0,<4.50.0'
```

### 방법 3: 테스트 및 검증

```bash
# 종합 테스트 실행
./run_tts_test.sh

# 또는 직접 실행
cd backend
python test_tts_standalone.py
```

## 📋 적용된 수정사항

### 1. 의존성 버전 제한 (`pyproject.toml`)
```toml
"transformers>=4.21.0,<4.50.0"  # GPT2InferenceModel.generate 메서드 지원
"torch>=2.0.0,<2.6.0"           # weights_only 기본값 변경 방지
"torchaudio>=2.0.0,<2.6.0"      # PyTorch 호환성 유지
```

### 2. TTS 서비스 강화 (`app/services/tts_service.py`)
- **Voice Cloning 실패 시 자동 fallback** → 기본 TTS로 전환
- **Transformers 호환성 오류 감지** → 구체적인 해결 방법 안내
- **다층 오류 처리** → 견고한 TTS 생성 프로세스

### 3. 호환성 진단 도구
- **`fix_pytorch_compatibility.py`** - 종합적인 호환성 문제 해결
- **`test_tts_standalone.py`** - TTS 기능 테스트 및 진단

## 🎯 기대 효과

### ✅ 문제 해결
- ~~Voice Cloning 실패~~ → **성공적인 TTS 생성**
- ~~라이브러리 호환성 오류~~ → **안정적인 의존성 버전**
- ~~급작스러운 실패~~ → **자동 fallback 메커니즘**

### 🔄 Fallback 메커니즘
1. **Voice Cloning 시도** (성우 음성 기반)
2. **실패 시 기본 TTS로 전환** (자동 fallback)
3. **오류 상황에서도 TTS 생성 완료**

## 🧪 검증 방법

### 1. 서버 로그 확인
```bash
# 성공적인 TTS 생성 로그
INFO:app.services.tts_service:✅ 실제 TTS 모델 초기화 완료
INFO:app.services.tts_service:Voice Cloning 완료
INFO:app.services.tts_service:✅ TTS 생성 완료
```

### 2. 프론트엔드 테스트
1. **성우 관리 페이지** → TTS 탭
2. **텍스트 입력** → 성우 선택 → TTS 생성
3. **생성 상태 확인** → 완료 후 재생 테스트

### 3. API 테스트
```bash
# TTS 스크립트 생성
curl -X POST http://localhost:8000/api/v1/voice-actors/tts-scripts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text_content": "안녕하세요", "voice_actor_id": "..."}'

# TTS 생성 요청
curl -X POST http://localhost:8000/api/v1/voice-actors/tts-scripts/{script_id}/generate \
  -H "Authorization: Bearer $TOKEN"
```

## 📝 추가 고려사항

### 장기적 해결 방안
1. **TTS 라이브러리 업데이트** - Coqui TTS 최신 버전으로 업그레이드
2. **대안 TTS 엔진** - Azure Speech Services, AWS Polly 등 고려
3. **모델 자체 학습** - 커스텀 Voice Cloning 모델 개발

### 모니터링 포인트
- TTS 생성 성공률 추적
- Voice Cloning vs 기본 TTS 사용 비율
- 라이브러리 업데이트 시 호환성 테스트

## 🆘 문제 지속시 체크리스트

1. **가상환경 재생성**
   ```bash
   rm -rf .venv
   uv venv
   source .venv/bin/activate
   uv sync
   ```

2. **캐시 정리**
   ```bash
   pip cache purge
   uv cache clean
   ```

3. **의존성 강제 재설치**
   ```bash
   uv sync --force
   ```

4. **서버 완전 재시작**
   ```bash
   pkill -f uvicorn
   uvicorn app.main:app --reload
   ```

5. **로그 레벨 상승**
   ```python
   # app/main.py
   logging.basicConfig(level=logging.DEBUG)
   ```

이제 TTS 생성이 안정적으로 작동할 것입니다! 🎉
