# 🎙️ TTS 기능 사용 가이드

## 📋 개요

이 프로젝트에서는 Voice Cloning 기반 TTS(Text-to-Speech) 기능을 제공합니다. 사용자는 성우를 등록하고, 음성 샘플을 업로드하여 해당 성우의 목소리로 텍스트를 음성으로 변환할 수 있습니다.

## 🚀 빠른 시작

### 1. 개발 환경 설정

```bash
# 프로젝트 루트에서 실행
chmod +x start_tts_dev.sh
./start_tts_dev.sh
```

이 스크립트는 다음을 자동으로 수행합니다:
- 백엔드 의존성 설치 및 서버 시작 (http://localhost:8000)
- 프론트엔드 의존성 설치 및 서버 시작 (http://localhost:3000)
- 데이터베이스 마이그레이션 실행
- 필요한 디렉토리 생성

### 2. 웹 브라우저에서 테스트

#### 방법 1: React 프론트엔드 사용
1. http://localhost:3000 접속
2. 로그인 후 "성우 및 음성 관리" 메뉴 클릭
3. TTS 기능 테스트

#### 방법 2: 테스트 페이지 사용
1. `tts_test_page.html` 파일을 브라우저에서 열기
2. 간단한 인터페이스로 TTS 기능 테스트

### 3. API 직접 테스트

```bash
# API 테스트 스크립트 실행
python test_tts_api.py
```

## 🎯 주요 기능

### 1. 성우 관리
- 성우 등록/수정/삭제
- 성별, 연령대, 언어 설정
- 음성 특징 관리 (톤, 스타일 등)

### 2. 음성 샘플 관리
- 성우별 음성 샘플 업로드
- 지원 형식: WAV, MP3
- 샘플 재생 및 관리

### 3. TTS 생성
- 텍스트 입력 후 음성 생성
- 성우 선택 (Voice Cloning)
- 음성 설정 (속도, 톤 등)
- 실시간 생성 상태 모니터링

### 4. TTS 라이브러리
- 재사용 가능한 공통 멘트 관리
- 카테고리별 분류
- 태그 기반 검색
- 사용 통계 추적

## 🔧 API 엔드포인트

### 성우 관리
```
GET    /api/v1/voice-actors           # 성우 목록 조회
POST   /api/v1/voice-actors           # 새 성우 등록
GET    /api/v1/voice-actors/{id}      # 특정 성우 조회
PUT    /api/v1/voice-actors/{id}      # 성우 정보 수정
DELETE /api/v1/voice-actors/{id}      # 성우 삭제
```

### 음성 샘플
```
POST   /api/v1/voice-actors/{id}/samples              # 음성 샘플 업로드
GET    /api/v1/voice-actors/{id}/samples              # 샘플 목록 조회
GET    /api/v1/voice-actors/{id}/samples/{sid}/audio  # 샘플 오디오 스트리밍
```

### TTS 생성
```
POST   /api/v1/voice-actors/tts-scripts                      # TTS 스크립트 생성
POST   /api/v1/voice-actors/tts-scripts/{id}/generate        # TTS 생성 요청
GET    /api/v1/voice-actors/tts-generations/{id}             # 생성 상태 조회
GET    /api/v1/voice-actors/tts-generations/{id}/audio       # 생성된 오디오 다운로드
GET    /api/v1/voice-actors/tts-generations                  # TTS 생성 목록 조회
```

### TTS 라이브러리
```
GET    /api/v1/voice-actors/tts-library              # 라이브러리 목록 조회
POST   /api/v1/voice-actors/tts-library              # 새 아이템 추가
GET    /api/v1/voice-actors/tts-library/{id}         # 특정 아이템 조회
PUT    /api/v1/voice-actors/tts-library/{id}         # 아이템 수정
DELETE /api/v1/voice-actors/tts-library/{id}         # 아이템 삭제
```

## 💻 개발자 가이드

### 백엔드 개발

#### TTS 서비스 커스터마이징
`backend/app/services/tts_service.py`에서 TTS 엔진을 변경할 수 있습니다:

```python
# 실제 TTS 모델 사용
from TTS.api import TTS
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)

# 커스텀 TTS 모델 사용
tts = TTS(model_path="/path/to/your/model", gpu=True)
```

#### 새로운 TTS 모델 추가
1. `VoiceModel` 테이블에 모델 정보 저장
2. `tts_service.py`에서 모델 로딩 로직 구현
3. API에서 모델 선택 기능 추가

### 프론트엔드 개발

#### 새로운 UI 컴포넌트 추가
`frontend/ment-gen/app/voice-actors/page.tsx`에서 UI를 확장할 수 있습니다.

#### API 호출 예시
```typescript
// TTS 생성 요청
const response = await fetch(`${API_BASE_URL}/voice-actors/tts-scripts/${scriptId}/generate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    script_id: scriptId,
    generation_params: { quality: 'high' }
  })
});
```

## 🛠️ 트러블슈팅

### 일반적인 문제

#### 1. TTS 생성이 실패하는 경우
- TTS 의존성이 올바르게 설치되었는지 확인
- GPU 메모리 부족 여부 확인
- 오디오 파일 디렉토리 권한 확인

```bash
# TTS 의존성 재설치
cd backend
pip install TTS torch torchaudio librosa soundfile
```

#### 2. 음성 샘플 업로드 실패
- 파일 형식 확인 (지원: WAV, MP3)
- 파일 크기 제한 확인 (기본: 10MB)
- voice_samples 디렉토리 권한 확인

#### 3. API 연결 오류
- 백엔드 서버 실행 상태 확인
- CORS 설정 확인
- 환경 변수 설정 확인

### 로그 확인

```bash
# 백엔드 로그
tail -f logs/backend.log

# 프론트엔드 로그  
tail -f logs/frontend.log

# TTS 서비스 로그
grep "TTS" logs/backend.log
```

### 디버깅 모드

```bash
# 백엔드 디버그 모드 실행
cd backend
python -m uvicorn app.main:app --reload --log-level debug

# TTS 테스트 스크립트 실행
python test_tts_integration.py
```

## 📚 추가 자료

### TTS 모델 정보
- [Coqui TTS](https://github.com/coqui-ai/TTS) - 사용 중인 오픈소스 TTS 라이브러리
- [XTTS v2](https://docs.coqui.ai/en/latest/models/xtts.html) - Voice Cloning 지원 모델

### API 문서
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 프로젝트 구조
```
backend/
├── app/
│   ├── models/
│   │   ├── voice_actor.py    # 성우 관련 모델
│   │   └── tts.py            # TTS 관련 모델
│   ├── api/routes/
│   │   └── voice_actors.py   # TTS API 라우터
│   └── services/
│       └── tts_service.py    # TTS 비즈니스 로직
├── audio_files/              # 생성된 TTS 파일
└── voice_samples/            # 업로드된 음성 샘플

frontend/ment-gen/
├── app/
│   ├── voice-actors/         # 성우 관리 페이지
│   └── tts/                  # TTS 관리 페이지
└── components/ui/            # UI 컴포넌트
```

## 🤝 기여하기

1. 이슈 등록 또는 기능 제안
2. 브랜치 생성 (`git checkout -b feature/새기능`)
3. 변경사항 커밋 (`git commit -m 'feat: 새로운 기능 추가'`)
4. 브랜치 푸시 (`git push origin feature/새기능`)
5. Pull Request 생성

## 📞 지원

문제가 발생하거나 도움이 필요한 경우:
1. 이슈 트래커에 문제 등록
2. 로그 파일과 함께 상세한 오류 정보 제공
3. 재현 가능한 테스트 케이스 작성

---

**즐거운 TTS 개발하세요! 🎉**
