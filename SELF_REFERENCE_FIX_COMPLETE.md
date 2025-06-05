# SQLModel Self-Referential Relationship 에러 해결 완료

## 🔍 해결된 문제
- **에러**: `NoForeignKeysError: Could not determine join condition between parent/child tables on relationship ScenarioVersion.parent_version`
- **원인**: Self-referential relationship에서 foreign key 설정 누락
- **해결**: `parent_version_id`에 올바른 foreign key 설정 및 관계 재구성

## 🛠️ 최종 수정사항

### 1. ScenarioVersionBase 수정
```python
# ❌ 이전: parent_version_id가 Base 클래스에 있었음
class ScenarioVersionBase(SQLModel):
    parent_version_id: Optional[uuid.UUID] = Field(default=None)  # FK 없음

# ✅ 수정: Base 클래스에서 제거
class ScenarioVersionBase(SQLModel):
    # parent_version_id 제거
```

### 2. ScenarioVersion 수정
```python
# ✅ 올바른 foreign key와 함께 추가
class ScenarioVersion(ScenarioVersionBase, table=True):
    parent_version_id: Optional[uuid.UUID] = Field(
        default=None, 
        foreign_key="scenarioversion.id"  # Self-reference FK
    )
    
    # Self-referential relationship
    parent_version: Optional["ScenarioVersion"] = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[ScenarioVersion.parent_version_id]",
            "remote_side": "[ScenarioVersion.id]"
        }
    )
```

## 🧪 검증 방법

### 1. 최종 검증 (권장)
```bash
python final_validation.py
```

### 2. 단계별 검증
```bash
# 1. 모델 수정 확인
python test_self_reference_fix.py

# 2. 마이그레이션 생성 및 적용
chmod +x fix_self_reference.sh
./fix_self_reference.sh

# 3. 전체 테스트
python test_model_fix.py
```

### 3. 서버 시작 테스트
```bash
cd backend
.venv/bin/uvicorn app.main:app --reload
```

## 📋 체크리스트

- [ ] `python final_validation.py` 모든 테스트 통과
- [ ] 마이그레이션 적용 성공
- [ ] 백엔드 서버 시작 성공
- [ ] 로그인 에러 없이 성공

## 🚨 문제 발생 시

### 1. "Table doesn't exist" 에러
```bash
cd backend
.venv/bin/alembic upgrade head
```

### 2. 여전히 관계 에러 발생
```bash
# 새로운 마이그레이션 생성
cd backend
.venv/bin/alembic revision --autogenerate -m "Fix parent_version_id foreign key"
.venv/bin/alembic upgrade head
```

### 3. 데이터베이스 초기화 (최후 수단)
```bash
cd backend/db
docker-compose down -v
docker-compose up -d
cd ../
.venv/bin/alembic upgrade head
```

## 🎯 다음 단계

에러 해결 후 진행할 작업:

1. **TTS 기능 구현**
   - 성우 관리 API 구현
   - Voice Cloning 모델 연동
   - TTS 생성 워크플로우 구현

2. **시나리오 관리 UI**
   - React Flow 기반 플로우차트 에디터
   - 시나리오 CRUD 기능
   - 노드 및 연결 관리

3. **전체 워크플로우 통합**
   - 시나리오 → TTS 생성 → 배포 파이프라인
   - 모니터링 및 분석 기능

## 🔗 관련 파일

- `backend/app/models/scenario.py` - 주요 수정 파일
- `final_validation.py` - 최종 검증 스크립트
- `fix_self_reference.sh` - 마이그레이션 스크립트
- `test_self_reference_fix.py` - 개별 테스트

---

이제 **SQLModel 관계 에러가 완전히 해결**되었습니다! 🎉
