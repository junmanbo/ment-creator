# Multiple Heads 문제 해결 가이드

## 🔍 문제 상황
- 현재 상태: `d275b7deb242`
- Head 1: `c3d4e5f6a7b8` (scenario TTS models)
- Head 2: `e4f5a6b7c8d9` (enhanced scenario version management)

## 🚀 해결 방법

### 방법 1: 자동 스크립트 사용 (권장)
```bash
python fix_multiple_heads.py
```

### 방법 2: 수동 해결
```bash
cd backend

# 1. 현재 상태 확인
.venv/bin/alembic current

# 2. 모든 heads 확인
.venv/bin/alembic heads

# 3. 각 head를 개별적으로 적용
.venv/bin/alembic upgrade c3d4e5f6a7b8
.venv/bin/alembic upgrade e4f5a6b7c8d9

# 4. Merge migration 생성
.venv/bin/alembic merge c3d4e5f6a7b8 e4f5a6b7c8d9 -m "Merge multiple heads"

# 5. 최종 업그레이드
.venv/bin/alembic upgrade head

# 6. 상태 확인
.venv/bin/alembic current
```

### 방법 3: 간단한 강제 해결 (개발 환경용)
```bash
cd backend

# 모든 heads를 한번에 적용
.venv/bin/alembic upgrade heads

# Merge migration 생성
.venv/bin/alembic merge heads -m "Merge all heads"

# 최종 업그레이드
.venv/bin/alembic upgrade head
```

## 🔧 트러블슈팅

### 에러: "Can't locate revision identified by..."
- 마이그레이션 파일이 손상되었을 수 있음
- `app/alembic/versions/` 디렉터리 확인

### 에러: "Target database is not up to date"
- 데이터베이스 스키마와 마이그레이션이 동기화되지 않음
- `alembic stamp head` 사용 고려

### 데이터베이스 초기화 (최후 수단)
```bash
# 주의: 모든 데이터 삭제됨
docker-compose down -v  # 데이터베이스 볼륨 삭제
docker-compose up -d    # 새로운 데이터베이스 시작
.venv/bin/alembic upgrade head  # 처음부터 마이그레이션 적용
```
