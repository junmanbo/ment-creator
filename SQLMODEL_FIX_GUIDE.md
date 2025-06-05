# SQLModel 관계 에러 해결 가이드

## 🔍 해결된 문제
- **에러**: `Mapper 'Scenario' has no property 'nodes'`
- **원인**: SQLModel 관계 정의가 잘못된 위치에 있었음
- **해결**: 관계 정의를 올바른 클래스로 이동 및 모델 import 최적화

## 🛠️ 수행된 수정사항

### 1. Scenario 모델 관계 정의 수정
```python
# ❌ 이전: VersionMergeRequest 클래스 안에 있던 관계 정의
class VersionMergeRequest(SQLModel):
    # ... 다른 필드들
    nodes: List["ScenarioNode"] = Relationship(...)  # 잘못된 위치

# ✅ 수정: Scenario 클래스로 이동
class Scenario(ScenarioBase, table=True):
    # ... 기본 필드들
    nodes: List["ScenarioNode"] = Relationship(
        back_populates="scenario",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
```

### 2. 모델 Import 최적화
- `app/models/__init__.py`: 누락된 모델들 추가
- `app/core/db.py`: 모든 모델 import 추가
- `app/main.py`: 앱 시작 시 SQLAlchemy 매퍼 구성

### 3. SQLAlchemy 매퍼 초기화
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    from sqlalchemy.orm import configure_mappers
    configure_mappers()  # 관계 설정 보장
    yield
```

## 🧪 테스트 방법

### 자동 검증
```bash
python test_model_fix.py
```

### 수동 테스트
1. **백엔드 시작**:
   ```bash
   cd backend
   .venv/bin/uvicorn app.main:app --reload
   ```

2. **프론트엔드 시작**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **로그인 테스트**: 웹 브라우저에서 로그인 시도

## 🚨 추가 문제 발생 시

### 1. "Table doesn't exist" 에러
```bash
cd backend
.venv/bin/alembic upgrade head
```

### 2. 여전히 관계 에러 발생
```bash
# 데이터베이스 초기화 (개발환경에서만)
cd backend/db
docker-compose down -v
docker-compose up -d
cd ..
.venv/bin/alembic upgrade head
```

### 3. Import 에러
- `app/models/__init__.py`에서 모든 모델이 정확히 import되었는지 확인
- 순환 import 문제가 없는지 확인

## 📋 체크리스트

- [ ] `python test_model_fix.py` 성공
- [ ] 백엔드 서버 시작 성공
- [ ] 로그인 에러 없이 성공
- [ ] API 엔드포인트 정상 작동

## 🔗 관련 파일

- `backend/app/models/scenario.py` - 주요 수정 파일
- `backend/app/models/__init__.py` - 모델 import 설정
- `backend/app/main.py` - 앱 시작 시 매퍼 구성
- `backend/app/core/db.py` - 데이터베이스 초기화
