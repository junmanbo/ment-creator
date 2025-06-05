# 데이터베이스 실행 및 마이그레이션 가이드

## 1. 데이터베이스 실행
```bash
# PostgreSQL Docker 컨테이너 실행
cd /home/jun/projects/ment-creator/backend/db
docker-compose up -d

# 또는 시스템에 PostgreSQL이 설치되어 있다면
sudo systemctl start postgresql
```

## 2. 마이그레이션 실행
```bash
cd /home/jun/projects/ment-creator/backend

# 현재 마이그레이션 상태 확인
.venv/bin/alembic current

# 마이그레이션 실행
.venv/bin/alembic upgrade head

# 성공 확인
.venv/bin/alembic current
```

## 3. 에러 해결 확인
마이그레이션이 성공하면 다음과 같은 메시지가 표시됩니다:
```
INFO  [alembic.runtime.migration] Running upgrade -> e4f5a6b7c8d9, enhanced scenario version management
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
```

## 4. 추가 문제 발생 시
만약 다른 에러가 발생하면:
1. 데이터베이스 연결 확인
2. 환경변수 설정 확인 (.env 파일)
3. Docker 컨테이너 상태 확인: `docker ps`
