# 🔧 문제 해결 가이드

> 개발 중 자주 발생하는 이슈들과 해결 방법

## 🚨 일반적인 문제들

### 1. 백엔드 서버 시작 오류

#### 증상: `uvicorn app.main:app` 실행 시 오류
```bash
ImportError: No module named 'app'
```

**해결방법:**
```bash
# 1. 올바른 디렉토리 확인
cd backend
pwd  # /path/to/ment-creator/backend 확인

# 2. 가상환경 활성화 확인
source .venv/bin/activate
which python  # .venv/bin/python 확인

# 3. 의존성 재설치
uv sync

# 4. 올바른 실행 명령
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 증상: 데이터베이스 연결 오류
```bash
sqlalchemy.exc.OperationalError: could not connect to server
```

**해결방법:**
```bash
# 1. PostgreSQL 서비스 상태 확인
sudo systemctl status postgresql
# 또는 macOS: brew services list | grep postgresql

# 2. PostgreSQL 시작
sudo systemctl start postgresql
# 또는 macOS: brew services start postgresql

# 3. 데이터베이스 연결 테스트
psql -h localhost -U ars_user -d ars_db

# 4. 환경변수 확인
cat .env | grep DATABASE_URL
```

### 2. 프론트엔드 빌드 오류

#### 증상: `npm run dev` 실행 시 TypeScript 오류
```bash
Type error: Cannot find module '@/components/ui/button'
```

**해결방법:**
```bash
# 1. 의존성 재설치
cd frontend/ment-gen
rm -rf node_modules package-lock.json
npm install

# 2. TypeScript 설정 확인
cat tsconfig.json

# 3. 경로 별칭 확인
cat next.config.js

# 4. shadcn/ui 컴포넌트 재설치
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input
```

#### 증상: 빌드 시 환경변수 오류
```bash
Error: NEXT_PUBLIC_API_BASE_URL is not defined
```

**해결방법:**
```bash
# 1. 환경변수 파일 생성
touch .env.local

# 2. 환경변수 설정
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1" >> .env.local

# 3. 개발 서버 재시작
npm run dev
```

### 3. TTS 생성 관련 문제

#### 증상: TTS 생성이 계속 "pending" 상태
```json
{
  "status": "pending",
  "error_message": null
}
```

**해결방법:**
```bash
# 1. TTS 모듈 상태 확인
cd backend
python -c "from TTS.api import TTS; print('TTS 모듈 정상')"

# 2. GPU/CPU 사용량 확인
nvidia-smi  # GPU 사용 시
htop        # CPU 사용량

# 3. TTS 모델 캐시 확인
ls -la ~/.cache/tts/

# 4. 백엔드 로그 확인
tail -f logs/app.log

# 5. 수동 TTS 생성 테스트
python -c "
from TTS.api import TTS
tts = TTS('tts_models/multilingual/multi-dataset/xtts_v2')
tts.tts_to_file(text='테스트', file_path='test.wav', language='ko')
print('TTS 생성 성공')
"
```

#### 증상: "CUDA out of memory" 오류
```bash
RuntimeError: CUDA out of memory
```

**해결방법:**
```bash
# 1. GPU 메모리 확인
nvidia-smi

# 2. 환경변수에서 CPU 모드로 변경
export CUDA_VISIBLE_DEVICES=""

# 3. TTS 설정에서 GPU 비활성화
# tts_service.py에서 gpu=False로 설정

# 4. 다른 CUDA 프로세스 종료
sudo fuser -v /dev/nvidia*
```

### 4. 데이터베이스 마이그레이션 문제

#### 증상: Alembic 마이그레이션 실패
```bash
alembic.util.exc.CommandError: Target database is not up to date
```

**해결방법:**
```bash
# 1. 현재 마이그레이션 상태 확인
alembic current

# 2. 마이그레이션 히스토리 확인
alembic history

# 3. 수동으로 최신 마이그레이션 적용
alembic upgrade head

# 4. 마이그레이션 충돌 해결
alembic merge heads

# 5. 데이터베이스 초기화 (개발 환경만)
alembic downgrade base
alembic upgrade head
```

#### 증상: 중복된 테이블 생성 오류
```bash
ProgrammingError: relation "user" already exists
```

**해결방법:**
```bash
# 1. 기존 테이블 확인
psql -h localhost -U ars_user -d ars_db -c "\dt"

# 2. Alembic 버전 테이블 확인
psql -h localhost -U ars_user -d ars_db -c "SELECT * FROM alembic_version;"

# 3. 기존 스키마와 Alembic 동기화
alembic stamp head

# 4. 필요시 수동으로 테이블 삭제 후 재생성
psql -h localhost -U ars_user -d ars_db -c "DROP TABLE IF EXISTS user CASCADE;"
alembic upgrade head
```

### 5. 인증 및 권한 문제

#### 증상: JWT 토큰 만료 오류
```json
{
  "detail": "Could not validate credentials"
}
```

**해결방법:**
```javascript
// 프론트엔드에서 토큰 갱신 로직 추가
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
    } else {
      window.location.href = '/login';
    }
  } catch (error) {
    window.location.href = '/login';
  }
};
```

#### 증상: CORS 오류
```bash
Access to fetch at 'http://localhost:8000/api/v1/login' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**해결방법:**
```python
# backend/app/main.py에서 CORS 설정 확인
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 프론트엔드 URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6. 파일 업로드 문제

#### 증상: 파일 업로드 크기 초과 오류
```json
{
  "detail": "Request entity too large"
}
```

**해결방법:**
```python
# backend/app/main.py에서 파일 크기 제한 설정
from fastapi import FastAPI, File, UploadFile

app = FastAPI()

# 파일 크기 제한 (50MB)
app.add_middleware(
    LimitUploadSizeMiddleware,
    max_upload_size=50 * 1024 * 1024  # 50MB
)
```

#### 증상: 음성 파일 재생 안됨
```bash
GET /api/v1/ments/{ment_id}/audio returns 404
```

**해결방법:**
```bash
# 1. 파일 경로 확인
ls -la audio_files/

# 2. 파일 권한 확인
chmod 644 audio_files/*.wav

# 3. 백엔드 정적 파일 서빙 설정 확인
# main.py에서 StaticFiles 마운트 확인

# 4. 파일 경로 상대/절대 경로 확인
python -c "
import os
print(os.path.abspath('audio_files'))
print(os.listdir('audio_files'))
"
```

---

## 🔍 디버깅 도구

### 1. 로그 확인

#### 백엔드 로그
```bash
# 애플리케이션 로그
tail -f backend/logs/app.log

# uvicorn 로그
uvicorn app.main:app --log-level debug

# PostgreSQL 로그
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 프론트엔드 로그
```bash
# Next.js 개발 서버 로그
npm run dev

# 브라우저 개발자 도구 → Console 탭
# Network 탭에서 API 요청/응답 확인
```

### 2. 데이터베이스 디버깅

#### PostgreSQL 연결 테스트
```bash
# 기본 연결
psql -h localhost -U ars_user -d ars_db

# 테이블 목록 확인
\dt

# 특정 테이블 스키마 확인
\d user

# 데이터 확인
SELECT * FROM "user" LIMIT 5;

# 활성 연결 확인
SELECT * FROM pg_stat_activity WHERE datname = 'ars_db';
```

#### SQLModel 쿼리 디버깅
```python
# backend에서 SQL 쿼리 로깅 활성화
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# 또는 main.py에서
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    print("SQL Query:", statement)
    print("Parameters:", parameters)
```

### 3. API 디버깅

#### 요청/응답 로깅
```python
# backend/app/main.py에 미들웨어 추가
import time
from fastapi import Request

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    print(f"Request: {request.method} {request.url}")
    print(f"Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    print(f"Response: {response.status_code} ({process_time:.2f}s)")
    
    return response
```

#### cURL을 이용한 API 테스트
```bash
# 로그인 테스트
curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password"}'

# 인증이 필요한 API 테스트
curl -X GET http://localhost:8000/api/v1/voice-actors \
  -H "Authorization: Bearer your-jwt-token"

# 파일 업로드 테스트
curl -X POST http://localhost:8000/api/v1/voice-actors/uuid/samples \
  -H "Authorization: Bearer your-jwt-token" \
  -F "audio_file=@sample.wav" \
  -F "text_content=테스트 텍스트"
```

---

## 📊 성능 모니터링

### 시스템 리소스 확인
```bash
# CPU 및 메모리 사용량
htop

# 디스크 사용량
df -h

# 네트워크 연결 상태
netstat -tlnp | grep :8000

# 프로세스별 메모리 사용량
ps aux | grep uvicorn
```

### 데이터베이스 성능
```sql
-- 느린 쿼리 확인
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- 테이블 크기 확인
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE tablename = 'ttsgeneration';

-- 인덱스 사용률 확인
SELECT schemaname,tablename,indexname,idx_scan,idx_tup_read,idx_tup_fetch 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

---

## 🆘 응급 복구 절차

### 1. 서비스 완전 재시작
```bash
# 1. 모든 프로세스 종료
pkill -f uvicorn
pkill -f "npm run dev"

# 2. 데이터베이스 재시작
sudo systemctl restart postgresql

# 3. 백엔드 재시작
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 4. 프론트엔드 재시작
cd frontend/ment-gen
npm run dev
```

### 2. 데이터베이스 복구
```bash
# 백업에서 복구
pg_restore -h localhost -U ars_user -d ars_db backup.sql

# 또는 스키마만 재생성
cd backend
alembic downgrade base
alembic upgrade head
```

### 3. 파일 시스템 복구
```bash
# 권한 복구
sudo chown -R $USER:$USER backend/audio_files
sudo chown -R $USER:$USER backend/voice_samples
chmod -R 755 backend/audio_files
chmod -R 755 backend/voice_samples

# 디렉토리 재생성
mkdir -p backend/audio_files
mkdir -p backend/voice_samples
mkdir -p backend/voice_models
```

---

## 📞 지원 받기

### 1. 로그 수집
문제 신고 시 다음 정보를 포함해주세요:

```bash
# 시스템 정보
uname -a
python --version
node --version
psql --version

# 에러 로그
tail -n 50 backend/logs/app.log
tail -n 50 /var/log/postgresql/postgresql-15-main.log

# 환경 설정
cat backend/.env | grep -v SECRET
cat frontend/ment-gen/.env.local | grep -v SECRET
```

### 2. 재현 단계
1. 문제가 발생한 정확한 단계
2. 예상했던 결과
3. 실제 발생한 결과
4. 에러 메시지 (있는 경우)
5. 브라우저 및 OS 정보

### 3. 임시 해결책
각 문제별로 제시된 해결책을 순서대로 시도하고, 어느 단계에서 해결되었는지 기록해주세요.

---

**💡 예방 팁**: 정기적인 백업과 로그 모니터링으로 문제를 사전에 방지하세요!