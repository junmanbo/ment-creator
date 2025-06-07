# 🚨 로그인 오류 해결 가이드

## 문제 상황
`TypeError: Failed to fetch` 오류가 발생하여 로그인이 되지 않는 상황

## 📋 문제 진단 체크리스트

### 1. 백엔드 서버 실행 확인
터미널에서 다음 명령어로 확인:
```bash
curl http://localhost:8000/docs
# 또는 
curl http://localhost:8000/api/v1/login/access-token
```

**예상 결과**: 
- 정상: HTML 응답 또는 JSON 응답
- 오류: `curl: (7) Failed to connect` → 백엔드 미실행

### 2. 백엔드 서버 시작
```bash
cd /home/jun/projects/ment-creator/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 프론트엔드 환경변수 확인
```bash
# frontend/ment-gen/.env.local 확인
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1"
```

### 4. 브라우저 개발자도구 확인
1. F12로 개발자도구 열기
2. Network 탭에서 실패한 요청 확인
3. Console 탭에서 상세 오류 메시지 확인

## 🚀 빠른 해결 방법

### 방법 1: 자동 스크립트 사용
```bash
cd /home/jun/projects/ment-creator
chmod +x scripts/start_system.sh
./scripts/start_system.sh
```

### 방법 2: 수동 실행

#### 터미널 1 - 백엔드
```bash
cd /home/jun/projects/ment-creator/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 터미널 2 - 프론트엔드
```bash
cd /home/jun/projects/ment-creator/frontend/ment-gen
npm run dev
```

## 🔍 상세 진단

### CORS 오류인 경우
백엔드 로그에서 다음과 같은 메시지 확인:
```
INFO: Uvicorn running on http://0.0.0.0:8000
```

### 포트 충돌인 경우
```bash
# 8000번 포트 사용 중인 프로세스 확인
sudo lsof -i :8000
# 프로세스 종료
sudo kill -9 <PID>
```

### 데이터베이스 연결 오류인 경우
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql
# PostgreSQL 시작
sudo systemctl start postgresql
```

## ✅ 성공 확인

1. **백엔드**: http://localhost:8000/docs 접속 → Swagger UI 표시
2. **프론트엔드**: http://localhost:3000 접속 → 로그인 페이지 표시
3. **로그인 테스트**: 기본 계정으로 로그인 시도

## 🔧 추가 문제 해결

### 가상환경 문제
```bash
cd /home/jun/projects/ment-creator/backend
rm -rf .venv
uv venv
source .venv/bin/activate
uv sync
```

### Node.js 의존성 문제
```bash
cd /home/jun/projects/ment-creator/frontend/ment-gen
rm -rf node_modules package-lock.json
npm install
```

## 📞 지원 요청

여전히 문제가 해결되지 않는 경우:
1. 백엔드 터미널의 전체 오류 로그 복사
2. 브라우저 개발자도구의 Network/Console 탭 스크린샷
3. 시스템 환경 정보 (OS, Node.js 버전, Python 버전)

---
**최종 업데이트**: 2025-06-08
