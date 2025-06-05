# 시나리오 버전 관리 강화 기능

손해보험 콜센터 ARS 시나리오 관리 시스템의 강화된 버전 관리 기능에 대한 설명입니다.

## 📋 주요 기능

### 1. 🏷️ 버전 상태 관리
- **Draft**: 초안 상태, 개발/테스트 중인 버전
- **Stable**: 안정적인 버전, 내부 테스트 완료
- **Release**: 배포된 버전, 운영 환경에서 사용 중
- **Deprecated**: 지원 중단된 버전

### 2. 🔄 자동 버전 생성
- 시나리오 변경 시 자동으로 버전 생성
- 변경 사항 자동 감지 및 요약
- 수동 백업 버전 생성 지원

### 3. 🔍 버전 비교 기능
- 두 버전 간 상세 차이점 분석
- 노드/연결 추가, 수정, 삭제 내역 표시
- 변경 통계 및 시각적 비교

### 4. ⏮️ 스마트 롤백
- 특정 버전으로 안전한 롤백
- 롤백 전 자동 백업 생성 옵션
- 롤백 사유 기록 및 추적

### 5. 🌳 버전 브랜치 관리
- 기존 버전에서 브랜치 생성
- 병렬 개발 지원
- 버전 트리 시각화

### 6. 🏷️ 태그 및 릴리즈 노트
- 버전별 태그 지정 (예: v1.0-stable, hotfix-001)
- 상세한 변경 로그 관리
- 릴리즈 노트 자동 생성

## 🚀 사용 방법

### 백엔드 API

#### 자동 버전 생성
```python
POST /scenarios/{scenario_id}/versions/auto
```

#### 수동 버전 생성
```python
POST /scenarios/{scenario_id}/versions
{
  "version": "2.0",
  "version_status": "stable",
  "tag": "v2.0-stable",
  "notes": "주요 기능 업데이트"
}
```

#### 버전 비교
```python
GET /scenarios/{scenario_id}/versions/{version_from_id}/compare/{version_to_id}
```

#### 버전 롤백
```python
POST /scenarios/{scenario_id}/versions/rollback
{
  "target_version_id": "uuid",
  "create_backup": true,
  "rollback_notes": "긴급 롤백 - 버그 수정"
}
```

#### 브랜치 생성
```python
POST /scenarios/{scenario_id}/versions/{parent_version_id}/branch
{
  "version": "2.1-feature",
  "version_status": "draft",
  "tag": "feature-branch",
  "notes": "새 기능 개발용 브랜치"
}
```

### 프론트엔드 사용법

#### 1. 버전 히스토리 탭
- 모든 버전 목록 확인
- 버전 상태별 필터링
- 자동 생성 버전 포함/제외 설정

#### 2. 버전 비교 탭
- 두 버전 선택하여 차이점 비교
- 노드/연결 변경 사항 시각화
- 변경 통계 표시

#### 3. 버전 트리 탭
- 브랜치 구조 시각화
- 부모-자식 관계 표시
- 새 브랜치 생성

#### 4. 고급 도구 탭
- 버전 롤백
- 브랜치 생성
- 수동 백업

## 🛠️ 설치 및 설정

### 1. 데이터베이스 마이그레이션
```bash
cd backend
alembic upgrade head
```

### 2. 의존성 설치
백엔드 의존성은 이미 설치되어 있습니다.

### 3. 환경 변수 설정
```bash
# .env 파일에 추가
AUTO_VERSION_ENABLED=true
VERSION_RETENTION_DAYS=90
```

## 📊 데이터베이스 스키마

### ScenarioVersion 테이블 확장
```sql
-- 새로 추가된 컬럼들
version_status ENUM('draft', 'stable', 'release', 'deprecated') DEFAULT 'draft'
tag VARCHAR(50) NULL
parent_version_id UUID NULL REFERENCES scenarioversion(id)
change_summary JSON NULL
auto_generated BOOLEAN DEFAULT false
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 인덱스
```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_scenarioversion_scenario_status ON scenarioversion(scenario_id, version_status);
CREATE INDEX idx_scenarioversion_tag ON scenarioversion(tag);
CREATE INDEX idx_scenarioversion_auto_generated ON scenarioversion(auto_generated);
CREATE INDEX idx_scenarioversion_parent ON scenarioversion(parent_version_id);
```

## 🔧 고급 설정

### 자동 버전 생성 정책
```python
# services/scenario_version_service.py에서 설정 가능
class VersionPolicy:
    AUTO_CREATE_ON_SAVE = True  # 저장 시 자동 버전 생성
    AUTO_CREATE_THRESHOLD = 5   # 노드 변경 임계값
    VERSION_RETENTION_DAYS = 90  # 버전 보관 기간
```

### 버전 네이밍 컨벤션
- **Major.Minor**: 일반 버전 (예: 1.0, 1.1, 2.0)
- **Major.Minor-tag**: 태그 포함 버전 (예: 1.0-stable, 2.1-feature)
- **자동 생성**: 기존 버전에서 마이너 버전 자동 증가

## 🚨 주의사항

### 1. 버전 관리 모범 사례
- 중요한 변경 전에는 수동 백업 생성
- 태그를 활용한 의미있는 버전 관리
- 릴리즈 버전은 신중하게 생성

### 2. 성능 고려사항
- 버전이 많아질수록 히스토리 로딩 시간 증가
- 자동 버전 생성 빈도 조절 필요
- 오래된 버전 정리 정책 수립

### 3. 권한 관리
- 롤백 권한은 관리자만 가능하도록 설정
- 릴리즈 버전 생성 권한 제한
- 중요 버전 삭제 방지

## 📈 성능 최적화

### 1. 버전 히스토리 페이징
```python
# 대량 버전 처리를 위한 페이징
GET /scenarios/{scenario_id}/versions?page=1&limit=20
```

### 2. 변경 사항 캐싱
```python
# Redis를 활용한 비교 결과 캐싱
CACHE_KEY = f"version_diff:{from_id}:{to_id}"
```

### 3. 백그라운드 처리
```python
# 대용량 스냅샷 생성 시 백그라운드 처리
from celery import Celery
app = Celery('version_service')
```

## 🔄 업그레이드 가이드

### Phase 1에서 Phase 2로 업그레이드
1. 데이터베이스 백업
2. 마이그레이션 실행
3. 기존 버전 데이터 변환
4. 새 기능 테스트

```bash
# 업그레이드 스크립트
cd backend
python scripts/upgrade_version_management.py
```

## 💡 활용 사례

### 1. 개발 워크플로우
1. **개발자**: Draft 상태로 새 기능 개발
2. **테스터**: Stable 상태로 내부 테스트
3. **운영자**: Release 상태로 운영 배포

### 2. 긴급 수정
1. 문제 발생 시 즉시 이전 Stable 버전으로 롤백
2. Hotfix 브랜치 생성하여 수정 작업
3. 수정 완료 후 새 Release 버전 배포

### 3. A/B 테스팅
1. 기존 버전에서 브랜치 생성
2. 두 버전을 병렬로 테스트
3. 성능 좋은 버전을 메인으로 병합

---

**강화된 버전 관리 시스템으로 더욱 안전하고 체계적인 시나리오 관리를 경험해보세요!** 🚀
