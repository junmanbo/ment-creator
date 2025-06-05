# 🎭 ARS 시나리오 관리 시스템

> 손해보험 콜센터 ARS 시나리오를 관리하고, Voice Cloning 기반 TTS 멘트를 생성하는 웹 애플리케이션

## 🌟 주요 기능

### ✅ 구현 완료된 기능
- **사용자 인증**: JWT 기반 로그인/로그아웃 시스템
- **성우 관리**: 성우 등록, 음성 샘플 업로드, 성우별 특성 관리
- **TTS 생성**: Voice Cloning 기반 고품질 음성 생성
- **음성 라이브러리**: 재사용 가능한 공통 멘트 관리
- **멘트 관리**: 기본 멘트 CRUD 기능
- **반응형 UI**: 모바일/태블릿/데스크톱 지원

### 🚧 진행 중인 기능
- **시나리오 관리**: 플로우차트 기반 ARS 시나리오 편집기
- **모니터링 대시보드**: TTS 생성 현황 및 시스템 성능 모니터링
- **배포 관리**: 시나리오 배포 및 버전 관리

## 🛠️ 기술 스택

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+
- **ORM**: SQLModel + SQLAlchemy
- **Authentication**: JWT + OAuth2
- **TTS Engine**: Coqui XTTS v2 (Voice Cloning)
- **Background Tasks**: Celery + Redis

### Frontend
- **Framework**: Next.js 14 + React 18
- **Language**: TypeScript
- **UI Library**: Tailwind CSS + shadcn/ui
- **State Management**: Redux Toolkit
- **Icons**: Lucide React

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **File Storage**: MinIO (S3 Compatible)

## 🚀 빠른 시작

### 1. 필수 요구사항

#### 시스템 요구사항
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (백그라운드 작업용)

#### 선택사항 (권장)
- NVIDIA GPU (TTS 성능 향상)
- Docker (컨테이너 환경)

### 2. 프로젝트 클론

\`\`\`bash
git clone <repository-url>
cd ment-creator
\`\`\`

### 3. 데이터베이스 설정

#### PostgreSQL 설치 및 설정
\`\`\`bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# Docker 사용 (추천)
docker run --name postgres \\
  -e POSTGRES_PASSWORD=password \\
  -e POSTGRES_DB=ment_creator \\
  -p 5432:5432 \\
  -d postgres:15
\`\`\`

#### Redis 설치 및 설정
\`\`\`bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS (Homebrew)
brew install redis
brew services start redis

# Docker 사용 (추천)
docker run --name redis \\
  -p 6379:6379 \\
  -d redis:7
\`\`\`

### 4. 백엔드 설정

\`\`\`bash
cd backend

# UV를 사용한 의존성 설치 (권장)
uv venv
source .venv/bin/activate  # Linux/macOS
# .venv\\Scripts\\activate  # Windows
uv pip install -e .

# 또는 pip 사용
pip install -e .

# 환경변수 설정 확인
cp .env.example .env  # 필요시
\`\`\`

### 5. 프론트엔드 설정

\`\`\`bash
cd frontend/ment-gen

# 의존성 설치
npm install

# 환경변수 설정 확인
cp .env.example .env.local  # 필요시
\`\`\`

### 6. 애플리케이션 실행

#### 🚀 원클릭 실행 (권장)
\`\`\`bash
chmod +x start_app.sh
./start_app.sh
\`\`\`

#### 🔧 개별 실행
\`\`\`bash
# 터미널 1: 백엔드
./start_backend.sh

# 터미널 2: 프론트엔드  
./start_frontend.sh
\`\`\`

### 7. 애플리케이션 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs
- **Redoc**: http://localhost:8000/redoc

## 👨‍💻 개발 가이드

### 백엔드 개발

\`\`\`bash
cd backend

# 개발 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 데이터베이스 마이그레이션
alembic revision --autogenerate -m "Add new model"
alembic upgrade head

# 테스트 실행
pytest

# 코드 포맷팅
ruff format .
ruff check . --fix
\`\`\`

### 프론트엔드 개발

\`\`\`bash
cd frontend/ment-gen

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 타입 체크
npm run type-check

# 린팅
npm run lint
npm run lint:fix
\`\`\`

## 🎯 사용법

### 1. 초기 설정

1. **관리자 계정 생성**
   - 백엔드 초기 실행 시 자동으로 admin 계정이 생성됩니다
   - 기본 계정: admin / admin (운영환경에서는 반드시 변경)

2. **성우 등록**
   - 성우 관리 페이지에서 새 성우 등록
   - 성우별 특성 정보 입력 (연령대, 성별, 음성 특징 등)

3. **음성 샘플 업로드**
   - 각 성우별로 음성 샘플 파일 업로드
   - Voice Cloning 품질 향상을 위해 다양한 샘플 권장

### 2. TTS 생성

1. **TTS 생성 페이지** 접속
2. **텍스트 입력** 및 **성우 선택**
3. **생성 옵션 설정** (속도, 감정 등)
4. **TTS 생성** 버튼 클릭
5. **생성 상태 확인** 및 **결과 다운로드**

### 3. 음성 라이브러리 관리

1. **자주 사용하는 멘트**를 라이브러리에 등록
2. **카테고리별 분류** 및 **태그 관리**
3. **공개/비공개 설정**으로 팀 내 공유
4. **원클릭 재사용**으로 빠른 TTS 생성

## 🔧 고급 설정

### TTS 모델 설정

\`\`\`bash
# .env 파일에서 설정
DEFAULT_TTS_MODEL=tts_models/multilingual/multi-dataset/xtts_v2
USE_GPU=auto
MAX_CONCURRENT_TTS_JOBS=3
\`\`\`

### 파일 업로드 제한

\`\`\`bash
MAX_AUDIO_FILE_SIZE=50MB
ALLOWED_AUDIO_FORMATS=wav,mp3,ogg,flac,m4a
\`\`\`

### GPU 사용 설정

NVIDIA GPU가 있는 경우 TTS 생성 속도가 크게 향상됩니다:

\`\`\`bash
# CUDA 설치 확인
nvidia-smi

# PyTorch GPU 버전 설치
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
\`\`\`

## 📊 모니터링

### 시스템 상태 확인

- **대시보드**: http://localhost:3000/dashboard
- **TTS 생성 현황**: 실시간 생성 상태 및 큐 상태
- **성능 메트릭**: CPU, 메모리, 디스크 사용량
- **오류 로그**: 시스템 오류 및 알림

### API 모니터링

- **API 문서**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **메트릭**: http://localhost:8000/metrics

## 🐳 Docker 배포

### Docker Compose 사용

\`\`\`bash
# 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
\`\`\`

### 개별 컨테이너 빌드

\`\`\`bash
# 백엔드
cd backend
docker build -t ment-creator-backend .

# 프론트엔드
cd frontend/ment-gen
docker build -t ment-creator-frontend .
\`\`\`

## 🔒 보안 설정

### 운영환경 설정

1. **JWT Secret Key 변경**
\`\`\`bash
# backend/.env
SECRET_KEY=your-super-secure-secret-key
\`\`\`

2. **CORS 설정**
\`\`\`bash
ALLOWED_ORIGINS=https://yourdomain.com
\`\`\`

3. **데이터베이스 보안**
\`\`\`bash
DATABASE_URL=postgresql://user:password@localhost:5432/ment_creator
\`\`\`

## 🤝 기여하기

### 개발 환경 설정

1. **Fork** 및 **Clone**
2. **Feature 브랜치** 생성
3. **개발** 및 **테스트**
4. **Pull Request** 생성

### 코딩 스타일

- **Backend**: Black + Ruff
- **Frontend**: Prettier + ESLint
- **Commit**: Conventional Commits

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🆘 문제 해결

### 자주 발생하는 문제

1. **PostgreSQL 연결 오류**
   - PostgreSQL 서비스 실행 상태 확인
   - 데이터베이스 연결 정보 확인

2. **TTS 생성 실패**
   - GPU 메모리 부족: 배치 크기 줄이기
   - 모델 다운로드 실패: 인터넷 연결 확인

3. **프론트엔드 빌드 오류**
   - Node.js 버전 확인 (18+ 필요)
   - 의존성 재설치: \`rm -rf node_modules && npm install\`

### 지원

- **이슈 리포트**: GitHub Issues
- **기능 요청**: GitHub Discussions
- **문서**: 프로젝트 Wiki

---

**Made with ❤️ by the ARS Management Team**
