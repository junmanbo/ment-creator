# 📋 프로젝트 개요 - ARS 시나리오 관리 플랫폼

## 🎯 프로젝트 목적

손해보험사 콜센터의 ARS(자동응답시스템) 시나리오를 효율적으로 관리하고, Voice Cloning 기술을 활용한 고품질 TTS 멘트를 생성하여 **고객 응대 품질 향상 및 운영 효율성 극대화**

## 👥 대상 사용자

### 주 사용자
- **콜센터 운영 담당자**: ARS 시나리오 일상 관리
- **시나리오 기획자**: 새로운 시나리오 설계 및 기획

### 부 사용자  
- **콜센터 관리자**: 전체 시나리오 현황 모니터링
- **IT 관리자**: 시스템 배포 및 운영 관리

## 🔥 핵심 가치 제안

### 현재의 문제점
```
🔴 시나리오 관리의 혼재
• PPT 파일로 산재된 시나리오 관리
• 버전 관리 혼란 (v1.2_최종_진짜최종.pptx)
• 수정 이력 추적의 한계

🔴 멘트 제작의 비효율  
• 성우 녹음 요청 → 대기 → 수정 → 재녹음 (2~3주 소요)
• 멘트 수정의 어려움 및 높은 비용
• 일관성 없는 음질과 톤
```

### 솔루션의 혁신
```
🔵 시나리오 관리 혁신
• 플로우차트 기반 시각적 관리
• 중앙화된 시나리오 저장소  
• 체계적 버전 관리 시스템

🔵 멘트 제작 혁신
• Voice Cloning 기반 즉시 음성 생성
• 무제한 수정·재생성 가능
• 일관된 음질과 톤 보장
• 실시간 시뮬레이션 테스트
```

## 📊 기대 효과

### 정량적 효과
- **작업 시간**: 2-3주 → 30분 (95% 단축)
- **비용 절약**: 연간 2,300만원 (성우비 + 재작업비)
- **품질 일관성**: 무제한 수정으로 완벽한 품질 달성

### 정성적 효과
- **스트레스 해소**: 성우 일정 대기 불필요
- **즉시 피드백**: 실시간 수정 및 테스트
- **브랜드 일관성**: 통일된 음성 톤앤매너

## 🛠️ 핵심 기능 목록

### 1. 시나리오 관리 시스템
- **플로우차트 에디터**: 드래그앤드롭 기반 시각적 설계
- **노드 관리**: 시작/멘트/분기/상담원연결/종료 노드
- **버전 관리**: 변경 이력 추적 및 롤백
- **시나리오 템플릿**: 재사용 가능한 패턴 라이브러리

### 2. TTS 멘트 생성 시스템  
- **Voice Cloning**: 성우 음성 기반 고품질 TTS
- **실시간 생성**: 텍스트 입력 후 30초 내 완성
- **무제한 수정**: 마음에 들 때까지 재생성
- **음성 미리보기**: 즉시 재생 및 품질 확인

### 3. 성우 및 음성 모델 관리
- **성우 프로필**: 음성 특성 및 샘플 관리
- **모델 학습**: Voice Cloning 모델 학습 및 관리
- **품질 평가**: 생성 음성 품질 점수 시스템

### 4. 시뮬레이션 및 테스트
- **플로우 시뮬레이션**: 고객 여정 시뮬레이션
- **음성 플레이백**: 전체 시나리오 음성 재생
- **분기 테스트**: 다양한 조건별 분기 검증

### 5. 모니터링 및 관리
- **실시간 대시보드**: TTS 생성 현황 및 시스템 상태
- **사용 통계**: 시나리오별 이용 현황 분석
- **배포 관리**: 운영 환경 배포 및 롤백

## 🎨 사용자 여정

### 시나리오 작성자 여정
```
1. 시나리오 기획
   ↓
2. 플로우차트 설계 (드래그앤드롭)
   ↓  
3. 노드별 멘트 입력
   ↓
4. 성우 선택 후 TTS 생성 (30초)
   ↓
5. 음성 미리보기 및 수정
   ↓
6. 전체 시나리오 시뮬레이션
   ↓
7. 최종 승인 및 배포
```

### 운영 담당자 여정
```
1. 기존 시나리오 조회
   ↓
2. 수정 필요 부분 식별
   ↓
3. 해당 노드 클릭하여 편집
   ↓
4. 멘트 수정 후 즉시 TTS 재생성
   ↓
5. 변경사항 시뮬레이션 테스트
   ↓
6. 운영 반영
```

## 🏗️ 시스템 아키텍처 개요

```
Frontend (React + TypeScript)
├── 플로우차트 에디터 (React Flow)
├── 시나리오 관리 대시보드
└── TTS 생성 인터페이스

Backend (FastAPI + Python)
├── RESTful API
├── Voice Cloning 엔진 연동  
└── 비즈니스 로직 처리

Database (PostgreSQL)
├── 시나리오 메타데이터
├── 멘트 스크립트 관리
└── 버전 관리 데이터

AI Engine (Coqui XTTS v2)
├── 고품질 음성 합성
└── 성우별 음성 복제
```

## 📈 개발 진행 현황

### ✅ 완료 (85%)
- [x] 사용자 인증 시스템 (JWT)
- [x] 성우 관리 시스템 
- [x] 음성 모델 관리
- [x] TTS 생성 시스템 
- [x] 음성 라이브러리
- [x] 기본 CRUD API

### 🚧 진행 중 (10%)
- [ ] 시나리오 플로우차트 에디터
- [ ] 시나리오 시뮬레이션

### ❌ 예정 (5%)
- [ ] 모니터링 대시보드
- [ ] 배포 관리 시스템
- [ ] 실제 ARS 연동

## 🚀 다음 개발 우선순위

### Phase 1: 시나리오 관리 (2주)
- React Flow 기반 플로우차트 에디터
- 시나리오 노드 및 연결 관리
- 시나리오 CRUD 및 버전 관리

### Phase 2: 통합 테스트 (1주)  
- 시나리오-TTS 통합 워크플로우
- 전체 시뮬레이션 기능
- 사용자 인수 테스트

### Phase 3: 모니터링 (1주)
- 실시간 대시보드
- 성능 메트릭 수집
- 배포 준비

## 💡 성공 지표

### 기능적 지표
- 시나리오 생성 시간: 50% 단축
- TTS 품질 점수: 90점 이상  
- 시스템 가용성: 99.9% 이상

### 사용자 만족도
- 사용자 만족도: 4.5/5.0 이상
- 학습 곡선: 1주 이내
- 지원 요청: 월 10건 이하

---

## 📚 관련 문서

- **기술 구조**: `system-architecture.md`
- **API 명세**: `api-specification.md`  
- **DB 설계**: `database-design.md`
- **화면 설계**: `ui-wireframes.md`
- **구현 가이드**: `implementation-guide.md`