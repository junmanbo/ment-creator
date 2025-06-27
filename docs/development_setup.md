# 🛠️ 개발 환경 설정 가이드

## 📋 필수 요구사항

### 시스템 요구사항
- **OS**: Ubuntu 20.04+ / macOS 12+ / Windows 11 WSL2
- **Python**: 3.11+
- **Node.js**: 18+  
- **PostgreSQL**: 15+
- **Git**: 2.30+

### 권장 개발 도구
- **IDE**: VSCode + Python Extension
- **API 테스트**: Postman 또는 Thunder Client
- **DB 관리**: pgAdmin 4 또는 DBeaver

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd ment-creator
```

### 2. 백엔드 설정
```bash
# 백엔드 디렉토리로 이동
cd backend

# Python 가상환경 생성 (uv 사용)
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 의존성 설치
uv sync

# 환경변수 설정
cp .env.example .env
# .env 파일 수정 (아래 환경변수 섹션 참조)

# 데이터베이스 마이그레이션
alembic upgrade head

# 개발 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 프론트엔드 설정
```bash
# 새 터미널에서 프론트엔드 디렉토리로 이동
cd frontend/ment-gen

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 4. 접속 확인
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## ⚙️ 환경변수 설정

### 백엔드 (.env)
```bash
# 데이터베이스
DATABASE_URL=postgresql://username:password@localhost/ars_db

# JWT 설정  
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# TTS 설정
TTS_MODEL_CACHE_DIR=/app/tts_models
AUDIO_FILES_DIR=/app/audio_files
VOICE_SAMPLES_DIR=/app/voice_samples

# 파일 업로드
MAX_FILE_SIZE=50MB
ALLOWED_AUDIO_FORMATS=wav,mp3,flac

# 로깅
LOG_LEVEL=INFO
```

### 프론트엔드 (.env.local)
```bash
# API 연결
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# 인증
NEXT_PUBLIC_JWT_SECRET=same-as-backend-secret-key

# 업로드 설정
NEXT_PUBLIC_MAX_FILE_SIZE=50MB
```

## 🗄️ 데이터베이스 설정

### PostgreSQL 설치 및 설정
```bash
# Ubuntu
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# Windows (WSL2에서 Ubuntu 설치 후 위 Ubuntu 명령 실행)
```

### 데이터베이스 생성
```bash
# PostgreSQL 접속
sudo -u postgres psql

# 데이터베이스 및 사용자 생성
CREATE DATABASE ars_db;
CREATE USER ars_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ars_db TO ars_user;

# 확장 설치 (UUID 지원)
\c ars_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

### 마이그레이션 실행
```bash
cd backend

# 첫 마이그레이션 생성 (이미 존재하는 경우 건너뛰기)
alembic revision --autogenerate -m "Initial migration"

# 마이그레이션 적용
alembic upgrade head

# 현재 마이그레이션 상태 확인
alembic current
```

## 📦 의존성 관리

### 백엔드 의존성 (pyproject.toml)
```toml
[project]
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "sqlmodel>=0.0.14",
    "alembic>=1.12.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.6",
    "TTS>=0.22.0",
    "torch>=2.0.0",
    "torchaudio>=2.0.0",
    "librosa>=0.10.0",
    "soundfile>=0.12.0",
    "asyncpg>=0.29.0",
    "python-dotenv>=1.0.0"
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "httpx>=0.25.0",
    "black>=23.0.0",
    "isort>=5.12.0",
    "flake8>=6.0.0"
]
```

### 프론트엔드 의존성 (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "typescript": "^5.2.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.294.0",
    "reactflow": "^11.10.1",
    "@reactflow/controls": "^11.10.1",
    "@reactflow/background": "^11.10.1"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "eslint": "^8.52.0",
    "eslint-config-next": "^14.0.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  }
}
```

## 🧪 개발 도구 설정

### VSCode 설정 (.vscode/settings.json)
```json
{
  "python.defaultInterpreterPath": "./backend/.venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Git 설정
```bash
# 커밋 템플릿 설정
git config --local commit.template .gitmessage

# .gitmessage 파일 생성
cat > .gitmessage << EOF
# Type: Brief description (50 chars max)
#
# Types:
# feat: 새로운 기능
# fix: 버그 수정  
# docs: 문서 수정
# style: 코드 포맷팅
# refactor: 코드 리팩토링
# test: 테스트 추가
# chore: 빌드 및 패키지 관리

# Body: Detailed description (72 chars per line)
#

# Footer: Related issues, breaking changes
#
EOF
```

## 🐳 Docker 개발 환경 (선택사항)

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ars_db
      POSTGRES_USER: ars_user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - ./audio_files:/app/audio_files
      - ./voice_samples:/app/voice_samples
    environment:
      DATABASE_URL: postgresql://ars_user:password@postgres/ars_db
    depends_on:
      - postgres

  frontend:
    build: ./frontend/ment-gen  
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/ment-gen:/app
      - /app/node_modules
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:8000/api/v1

volumes:
  postgres_data:
```

### Docker 실행
```bash
# 전체 서비스 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 개별 서비스 재시작
docker-compose restart backend

# 서비스 중지
docker-compose down
```

## 🔧 개발 명령어 모음

### 백엔드 명령어
```bash
# 가상환경 활성화
source backend/.venv/bin/activate

# 개발 서버 실행 (자동 재로드)
uvicorn app.main:app --reload --port 8000

# 테스트 실행
pytest

# 코드 포맷팅
black .
isort .

# 린팅
flake8 .

# 새 마이그레이션 생성
alembic revision --autogenerate -m "Description"

# 마이그레이션 적용
alembic upgrade head

# 마이그레이션 롤백
alembic downgrade -1
```

### 프론트엔드 명령어
```bash
cd frontend/ment-gen

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 결과 실행
npm start

# 린팅
npm run lint

# 타입 체크
npm run type-check

# 테스트 (설정된 경우)
npm test
```

## 🚨 문제 해결

### 자주 발생하는 이슈

#### 1. Python 가상환경 문제
```bash
# uv가 설치되지 않은 경우
pip install uv

# 가상환경 재생성
rm -rf .venv
uv venv
source .venv/bin/activate
uv sync
```

#### 2. 데이터베이스 연결 문제
```bash
# PostgreSQL 서비스 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -h localhost -U ars_user -d ars_db
```

#### 3. 포트 충돌 문제
```bash
# 포트 사용 프로세스 확인
lsof -i :8000
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

#### 4. TTS 모델 다운로드 문제
```bash
# 캐시 디렉토리 권한 확인
chmod 755 ~/.cache/tts

# 수동 모델 다운로드
python -c "from TTS.api import TTS; TTS('tts_models/multilingual/multi-dataset/xtts_v2')"
```

### 로그 확인
```bash
# 백엔드 로그
tail -f backend/logs/app.log

# 프론트엔드 로그 (브라우저 개발자 도구)
# F12 → Console 탭

# 데이터베이스 로그
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

## 📚 개발 참고자료

- **FastAPI 문서**: https://fastapi.tiangolo.com/
- **React 문서**: https://react.dev/
- **Next.js 문서**: https://nextjs.org/docs
- **SQLModel 문서**: https://sqlmodel.tiangolo.com/
- **Coqui TTS**: https://docs.coqui.ai/
- **React Flow**: https://reactflow.dev/

---

**💡 개발 팁**: 환경 설정 후 `docs/current-progress.md`를 확인하여 현재 구현 상태와 다음 작업을 파악하세요!