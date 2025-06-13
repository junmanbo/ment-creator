# ARS Ment Creator Backend

손해보험 콜센터 ARS 시나리오 관리 시스템의 백엔드 API 서버입니다.

## 기술 스택

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0 + SQLModel
- **Authentication**: JWT + OAuth2
- **TTS Engine**: Fish Speech + Coqui TTS

## 주요 기능

- 🎭 성우 및 음성 모델 관리
- 🎙️ TTS 멘트 생성 및 관리
- 📋 ARS 시나리오 플로우차트 관리
- 🔄 TTS 엔진 전환 (Fish Speech ↔ Coqui TTS)
- 👥 사용자 인증 및 권한 관리
- 📊 시스템 모니터링 및 통계

## 설치 및 실행

### 1. 의존성 설치
```bash
# uv 사용 (권장)
uv sync

# 또는 pip 사용
pip install -e .
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 설정 입력
```

### 3. 데이터베이스 마이그레이션
```bash
alembic upgrade head
```

### 4. 서버 실행
```bash
# 개발 모드
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 또는 uv run 사용
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## TTS 엔진 설정

### Fish Speech (권장)
```bash
# Fish Speech 설치
python install_fish_speech.py

# 또는 전체 설치 스크립트
bash setup_fish_speech.sh
```

### Coqui TTS (대안)
```bash
# 자동으로 설치됨 (의존성에 포함)
```

## API 문서

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 주요 API 엔드포인트

### 인증
- `POST /api/v1/login` - 사용자 로그인
- `POST /api/v1/users/signup` - 사용자 회원가입

### 성우 관리
- `GET /api/v1/voice-actors` - 성우 목록 조회
- `POST /api/v1/voice-actors` - 새 성우 등록
- `POST /api/v1/voice-actors/{id}/samples` - 음성 샘플 업로드

### TTS 엔진 관리
- `GET /api/v1/tts-engines/` - 지원 엔진 목록
- `POST /api/v1/tts-engines/switch/{engine}` - 엔진 전환
- `POST /api/v1/tts-engines/benchmark` - 성능 비교

### TTS 생성
- `POST /api/v1/voice-actors/tts-scripts` - TTS 스크립트 생성
- `POST /api/v1/voice-actors/tts-scripts/{id}/generate` - TTS 생성 요청
- `GET /api/v1/voice-actors/tts-generations/{id}/audio` - 생성된 음성 다운로드

## 테스트

```bash
# TTS 시스템 통합 테스트
python test_fish_speech_integration.py

# 개별 TTS 기능 테스트
python test_tts_standalone.py
```

## 환경 변수

주요 환경 변수 설정:

```env
# 데이터베이스
POSTGRES_SERVER=localhost
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_db

# JWT 인증
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# TTS 설정
TTS_ENGINE=fish_speech  # fish_speech 또는 coqui
FISH_SPEECH_API_HOST=127.0.0.1
FISH_SPEECH_API_PORT=8765

# 파일 경로
AUDIO_FILES_DIR=./audio_files
VOICE_SAMPLES_DIR=./voice_samples
```

## 개발

### 코드 스타일
```bash
# 코드 포맷팅
ruff format .

# 린팅
ruff check .
```

### 새 API 추가
1. `app/api/routes/` 에 라우터 파일 생성
2. `app/api/main.py` 에 라우터 등록
3. 필요시 `app/models/` 에 데이터 모델 추가

### 데이터베이스 마이그레이션
```bash
# 새 마이그레이션 생성
alembic revision --autogenerate -m "Add new table"

# 마이그레이션 적용
alembic upgrade head
```

## 문제 해결

### TTS 관련 문제
- [VOICE_MODEL_TROUBLESHOOTING.md](./VOICE_MODEL_TROUBLESHOOTING.md) 참조

### PyTorch 호환성 문제
```bash
python fix_pytorch_compatibility.py
```

## 라이선스

이 프로젝트는 손해보험사 내부 사용을 위한 프로젝트입니다.

## 기여

프로젝트 개선 사항이나 버그 발견 시 이슈를 등록해주세요.
