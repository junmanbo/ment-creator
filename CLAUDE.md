# 🚀 ARS 시나리오 관리 플랫폼 - Claude Code 작업 가이드

> 손해보험 콜센터 ARS 시나리오 관리 및 Voice Cloning 기반 TTS 멘트 생성 시스템

## 📋 빠른 참조

### 프로젝트 정보
- **목적**: 콜센터 ARS 시나리오를 플로우차트로 관리하고 AI로 음성 멘트 생성
- **사용자**: 손해보험사 콜센터 운영팀, 시나리오 기획자
- **기술 스택**: FastAPI(Python) + React(TypeScript) + PostgreSQL + Voice Cloning TTS

### 현재 상태 (90% 완성)
✅ 사용자 인증, 성우 관리, 다중 참조 Voice Cloning TTS 시스템  
✅ 강화된 ARS 시나리오 노드 타입 및 설정 모델
🚧 시나리오 플로우차트 에디터 (프론트엔드 구현 중)  
❌ 모니터링 대시보드, 배포 시스템

---

## 📚 상세 문서 참조

### 1. 프로젝트 기획 및 설계
```
docs/project-overview.md     # 전체 기획서 및 기능 요약
docs/system-architecture.md # 시스템 구조 및 기술 스택
docs/database-design.md     # DB 설계 및 ERD
```

### 2. API 및 백엔드 개발
```
docs/api-specification.md   # 전체 API 명세서
docs/backend-development.md # 백엔드 구현 가이드
docs/tts-integration.md     # Voice Cloning TTS 연동
```

### 3. 프론트엔드 개발
```
docs/frontend-guide.md      # React 컴포넌트 구조
docs/ui-wireframes.md       # 화면 설계 및 사용법
docs/flowchart-editor.md    # React Flow 기반 시나리오 에디터
```

### 4. 개발 실무
```
docs/development-setup.md   # 환경 설정 및 실행 방법
docs/current-progress.md    # 현재 구현 상태 및 다음 단계
docs/implementation-guide.md # 즉시 구현 가능한 개선사항
```

---

## ⚡ 즉시 작업 가능한 우선순위

### 1순위: ARS 시나리오 에디터 (프론트엔드)
```typescript
# React Flow 기반 시나리오 에디터 구현
frontend/components/FlowchartEditor/
├── nodes/
│   ├── StartNode.tsx           # 시작점 노드
│   ├── ConditionNode.tsx       # 조건 분기 노드
│   ├── VoiceMentNode.tsx       # 음성 멘트 노드
│   ├── MenuSelectNode.tsx      # 메뉴 선택 노드
│   ├── InputCollectNode.tsx    # 입력 수집 노드
│   ├── ExternalApiNode.tsx     # 외부 API 호출 노드
│   └── TransferNode.tsx        # 상담사 연결 노드
└── ScenarioEditor.tsx          # 메인 에디터 컴포넌트
```

### 2순위: TTS 시스템 개선
```python
# 백그라운드 작업 처리 개선
backend/app/services/tts_service.py
backend/app/core/background_tasks.py

# 프론트엔드 상태 관리 개선
frontend/components/TTSGenerationStatus.tsx
```

### 3순위: 모니터링 대시보드
```python
# 시스템 메트릭 수집
backend/app/api/routes/monitoring.py
frontend/app/monitoring/page.tsx
```

---

## 🛠️ 개발 환경 빠른 설정

### 백엔드 실행
```bash
cd backend
uv venv && source .venv/bin/activate
uv sync
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 프론트엔드 실행  
```bash
cd frontend/ment-gen
npm install && npm run dev  # http://localhost:3000
```

### 주요 환경변수
```bash
# .env 파일
DATABASE_URL=postgresql://user:pass@localhost/ars_db
SECRET_KEY=your-secret-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 📁 프로젝트 구조

```
/home/jun/projects/ment-creator/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/routes/     # API 엔드포인트
│   │   ├── models/         # SQLModel 데이터 모델
│   │   ├── services/       # 비즈니스 로직
│   │   └── core/           # 설정, DB 등
│   ├── audio_files/        # 생성된 TTS 파일
│   ├── voice_samples/      # 성우 샘플 파일
│   └── voice_models/       # 학습된 모델 파일
├── frontend/ment-gen/      # Next.js 프론트엔드
│   ├── app/               # App Router 페이지
│   └── components/        # 재사용 컴포넌트
└── docs/                  # 프로젝트 문서
```

---

## 🎯 핵심 기능 흐름

### 1. 다중 참조 Voice Cloning TTS 생성 플로우
```
텍스트 입력 → 성우 선택 → 다중 참조 음성 자동 선택 → TTS 생성 요청 → 
비동기 처리 (GPU 메모리 최적화) → 상태 폴링 → 완료 → 오디오 재생/다운로드
```

### 2. ARS 시나리오 관리 플로우
```
시나리오 생성 → 플로우차트 편집 (강화된 노드 타입) → 노드별 설정 → 
조건 분기/메뉴 설정 → 외부 API 연동 → TTS 멘트 생성 → 시뮬레이션 → 배포
```

### 3. 콜센터 ARS 실행 플로우 (예시: 영업시간 시나리오)
```
시작점 → 영업일 체크 → 시간 체크 (09-18시) → 메인 메뉴 안내 →
메뉴 선택 → 서비스별 분기 → 고객 정보 수집 → 전문 호출 (LtrF020) →
결과 처리 → 상담사 연결 또는 종료
```

---

## 🎭 ARS 시나리오 노드 타입 가이드

### 1. START (시작점)
```python
# 시나리오의 진입점, 통화 시작 시 실행
NodeType.START
```

### 2. CONDITION (조건 분기)
```python
# 시간, 날짜, 값 비교 등 조건에 따른 흐름 제어
NodeType.CONDITION
```
**설정 예시:**
- **시간 체크**: 09:00-18:00 영업시간 확인
- **요일 체크**: 평일(월~금) vs 주말 구분
- **값 비교**: 입력받은 데이터 검증
- **API 결과**: 외부 호출 결과에 따른 분기

### 3. VOICE_MENT (음성 멘트)
```python
# TTS 또는 녹음된 음성 파일 재생
NodeType.VOICE_MENT
```
**설정 예시:**
- **텍스트**: "메뉴 개수는 6개입니다..."
- **성우**: 다중 참조 Voice Cloning 적용
- **재생 속도**: 0.8~1.2배속 조절
- **대기시간**: 멘트 후 0.5초 pause

### 4. MENU_SELECT (메뉴 선택)
```python
# DTMF 입력을 통한 메뉴 선택 처리
NodeType.MENU_SELECT
```
**설정 예시:**
```json
{
  "menu_items": [
    {"key": "1", "label": "사고접수", "target_node": "accident_node"},
    {"key": "2", "label": "자동차 고장출동", "target_node": "breakdown_node"},
    {"key": "3", "label": "신규가입상담", "target_node": "signup_node"}
  ]
}
```

### 5. INPUT_COLLECT (입력 수집)
```python
# 생년월일, 전화번호 등 고객 정보 수집
NodeType.INPUT_COLLECT
```
**수집 타입:**
- **BIRTH_DATE**: 생년월일 (YYYYMMDD)
- **PHONE_NUMBER**: 전화번호 (11자리)
- **BUSINESS_NUMBER**: 사업자번호
- **DTMF_DIGIT**: 일반 숫자 입력

### 6. EXTERNAL_API (외부 시스템 호출)
```python
# 기간계 시스템 전문 호출 및 외부 API 연동
NodeType.EXTERNAL_API
```
**호출 예시:**
```json
{
  "endpoint_name": "LtrF020",
  "request_mapping": {
    "birth_date": "{session.birth_date}",
    "phone_number": "{session.phone_number}"
  },
  "response_mapping": {
    "contract_list": "session.contracts",
    "customer_name": "session.customer_name"
  }
}
```

### 7. TRANSFER (상담사 연결)
```python
# 상담사 또는 특정 부서로 호전환
NodeType.TRANSFER
```
**연결 타입:**
- **agent**: 일반 상담사 연결
- **department**: 특정 부서 연결
- **external**: 외부 번호 연결

---

## 🔧 개발 가이드라인

### 코딩 스타일
- **타입 힌트**: 모든 함수에 타입 힌트 적용
- **문서화**: Swagger 자동 생성, 중요 로직 주석
- **테스트**: 중요 기능에 테스트 코드 작성
- **Context7**: 최신 FastAPI 패턴 적용

### Git 커밋 규칙
```bash
# 좋은 예
git add backend/app/models/scenario.py
git commit -m "feat: Add Scenario model with nodes and connections"

# 나쁜 예  
git add ./  # 절대 금지
git commit -m "update"  # 불명확한 메시지
```

### 파일 작업 주의사항
- `.venv/` 및 `.next/` 디렉토리는 작업에서 제외
- 상대 경로 전체 지정 방식 사용 금지

---

## 🚨 현재 알려진 이슈

1. **TTS 생성 시간**: 다중 참조 Voice Cloning시 60초 이상 소요 가능
2. **GPU 메모리 관리**: 3개 이상 참조시 CUDA OOM 발생 가능 (자동 fallback 구현됨)
3. **파일 저장 용량**: 음성 파일 누적 시 용량 관리 필요  
4. **시나리오 에디터**: React Flow 기반 노드 에디터 프론트엔드 구현 필요

---

## 📞 문의 및 지원

- **프로젝트 문서**: `docs/` 디렉토리 참조
- **API 문서**: http://localhost:8000/docs (Swagger)
- **현재 진행상황**: `docs/current-progress.md` 참조

---

**💡 개발 팁**: 각 기능 구현 전에 해당하는 docs 파일을 먼저 참조하여 전체 맥락을 파악한 후 작업하세요!