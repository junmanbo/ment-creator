# 🎯 손해보험 콜센터 ARS 시나리오 관리 시스템

## 📋 프로젝트 개요

손해보험사 콜센터의 ARS(자동응답시스템) 시나리오를 효율적으로 관리하고, **Voice Cloning 기술**을 활용한 고품질 TTS 멘트를 생성하는 통합 관리 시스템입니다.

### 🎨 주요 특징

- 🎛️ **직관적인 플로우차트 에디터** - React Flow 기반 드래그 앤 드롭
- 🎤 **Voice Cloning TTS** - 전문 성우 수준의 음성 생성
- 📊 **버전 관리 시스템** - 변경 이력 추적 및 롤백
- 🚀 **실시간 배포** - 테스트/운영 환경 배포 지원
- 👥 **사용자 권한 관리** - 역할별 접근 제어
- 📈 **모니터링 대시보드** - 성능 및 사용 통계

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React)       │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • React Flow    │    │ • SQLModel      │    │ • 시나리오 데이터│
│ • Next.js       │    │ • JWT Auth      │    │ • 사용자 관리   │
│ • TypeScript    │    │ • TTS API       │    │ • 음성 파일     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   TTS Engine    │
                    │  (Voice Clone)  │
                    │                 │
                    │ • Coqui XTTS    │
                    │ • 성우 음성 모델│
                    │ • 고품질 생성   │
                    └─────────────────┘
```

## 🚀 빠른 시작

### 1️⃣ 시스템 설정 및 실행

```bash
# 리포지토리 클론
git clone <repository-url>
cd ment-creator

# 전체 시스템 설정 (자동)
chmod +x setup_system.sh
./setup_system.sh

# 빠른 실행 (백엔드 + 프론트엔드 동시 실행)
chmod +x run_system.sh
./run_system.sh
```

### 2️⃣ 수동 실행 방법

#### 백엔드 API 서버
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 프론트엔드 개발 서버
```bash
cd frontend/ment-gen
npm run dev
```

### 3️⃣ 접속 주소

- 🌐 **웹 애플리케이션**: http://localhost:3000
- 📚 **API 문서**: http://localhost:8000/docs
- 🔧 **관리자 패널**: http://localhost:8000/admin

## 💻 기술 스택

### Backend
- **FastAPI** - 고성능 비동기 API 프레임워크
- **SQLModel** - 타입 안전한 SQL ORM
- **PostgreSQL** - 엔터프라이즈급 관계형 데이터베이스
- **Alembic** - 데이터베이스 마이그레이션
- **JWT** - 보안 인증 토큰
- **Coqui TTS** - Voice Cloning 엔진

### Frontend
- **React 18** - 사용자 인터페이스 라이브러리
- **Next.js 14** - 풀스택 React 프레임워크
- **TypeScript** - 타입 안전한 JavaScript
- **React Flow** - 플로우차트 에디터
- **Tailwind CSS** - 유틸리티 우선 CSS
- **Redux Toolkit** - 상태 관리

### DevOps
- **Docker** - 컨테이너화
- **tmux** - 터미널 멀티플렉서
- **Git** - 버전 관리

## 📁 프로젝트 구조

```
ment-creator/
├── 📱 backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/               # API 라우터
│   │   ├── models/            # SQLModel 모델
│   │   ├── services/          # 비즈니스 로직
│   │   ├── core/              # 핵심 설정
│   │   └── alembic/           # DB 마이그레이션
│   ├── audio_files/           # 생성된 TTS 파일
│   ├── voice_samples/         # 성우 음성 샘플
│   └── tts_models/            # Voice Cloning 모델
│
├── ⚛️ frontend/               # React 프론트엔드
│   └── ment-gen/
│       ├── app/               # Next.js 13+ 앱 라우터
│       ├── components/        # 재사용 컴포넌트
│       └── public/            # 정적 자산
│
├── 🛠️ scripts/               # 실행 스크립트
│   ├── setup_system.sh       # 전체 설정
│   ├── run_system.sh         # 빠른 실행
│   └── debug_system.sh       # 문제 해결
│
└── 📚 docs/                   # 문서
    ├── api_specification.md   # API 명세서
    ├── database_design.md     # 데이터베이스 설계
    └── system_flowchart.md    # 시스템 흐름도
```

## 🎮 핵심 기능

### 🎛️ 시나리오 관리
- **플로우차트 에디터**: 드래그 앤 드롭으로 ARS 플로우 설계
- **노드 타입**: 시작, 메시지, 분기, 상담원 연결, 입력, 종료
- **시뮬레이션**: 실제 배포 전 플로우 테스트
- **버전 관리**: 변경 이력 추적 및 롤백

### 🎤 TTS 음성 생성
- **성우 관리**: 다양한 성우 프로필 관리
- **Voice Cloning**: 성우 음성 기반 TTS 생성
- **품질 관리**: 생성된 음성의 품질 점수 평가
- **라이브러리**: 재사용 가능한 공통 멘트 관리

### 👥 사용자 관리
- **역할 기반 접근 제어**: 관리자, 운영자, 뷰어
- **JWT 인증**: 보안 토큰 기반 인증
- **활동 로그**: 사용자 행동 추적

### 🚀 배포 및 모니터링
- **환경별 배포**: 개발, 스테이징, 프로덕션
- **실시간 모니터링**: 시스템 성능 및 사용률
- **알림 시스템**: 오류 및 중요 이벤트 알림

## 📊 API 엔드포인트

### 🔐 인증
- `POST /auth/login` - 사용자 로그인
- `POST /auth/refresh` - 토큰 갱신
- `POST /auth/logout` - 로그아웃

### 🎭 시나리오 관리
- `GET /scenarios` - 시나리오 목록 조회
- `POST /scenarios` - 새 시나리오 생성
- `GET /scenarios/{id}` - 시나리오 상세 조회
- `PUT /scenarios/{id}` - 시나리오 수정
- `DELETE /scenarios/{id}` - 시나리오 삭제

### 🎤 TTS 관리
- `GET /voice-actors` - 성우 목록 조회
- `POST /voice-actors` - 새 성우 등록
- `POST /voice-actors/{id}/samples` - 음성 샘플 업로드
- `POST /tts-scripts/{id}/generate` - TTS 생성

### 📊 모니터링
- `GET /metrics/system` - 시스템 메트릭
- `GET /metrics/tts` - TTS 생성 통계
- `GET /alerts` - 알림 목록

## 🔧 개발 가이드

### 개발 환경 설정

1. **Python 가상환경 생성**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 또는
venv\\Scripts\\activate  # Windows
```

2. **의존성 설치**
```bash
# uv 사용 (권장)
uv install

# 또는 pip 사용
pip install -r requirements.txt
```

3. **환경 변수 설정**
```bash
cp .env.example .env
# .env 파일을 수정하여 실제 값으로 변경
```

4. **데이터베이스 마이그레이션**
```bash
alembic upgrade head
python app/initial_data.py
```

### 새 기능 개발

1. **백엔드 모델 추가**
```python
# app/models/new_model.py
class NewModel(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
```

2. **API 라우터 추가**
```python
# app/api/routes/new_routes.py
@router.get("/", response_model=List[NewModel])
def get_items(session: SessionDep, current_user: CurrentUser):
    # 구현 로직
    pass
```

3. **프론트엔드 페이지 추가**
```tsx
// app/new-feature/page.tsx
export default function NewFeaturePage() {
  // React 컴포넌트 구현
}
```

### 데이터베이스 마이그레이션

```bash
# 새 마이그레이션 생성
alembic revision --autogenerate -m "Add new feature"

# 마이그레이션 적용
alembic upgrade head

# 롤백
alembic downgrade -1
```

## 🛠️ 문제 해결

### 일반적인 문제들

#### 1. 데이터베이스 연결 오류
```bash
# PostgreSQL 상태 확인
systemctl status postgresql

# 데이터베이스 재시작
sudo systemctl restart postgresql

# 연결 테스트
psql $DATABASE_URL -c "SELECT 1;"
```

#### 2. TTS 생성 실패
```bash
# TTS 모델 캐시 초기화
rm -rf backend/tts_models/*

# 의존성 재설치
pip install --force-reinstall TTS torch torchaudio
```

#### 3. 프론트엔드 빌드 오류
```bash
# Node.js 캐시 정리
cd frontend/ment-gen
rm -rf .next node_modules
npm install
```

### 자동 진단 도구

```bash
# 시스템 전체 진단
./debug_system.sh

# 특정 문제 해결
./debug_system.sh --fix-database
./debug_system.sh --clear-cache
./debug_system.sh --reinstall-deps
```

## 📈 성능 최적화

### 백엔드 최적화
- **데이터베이스 인덱스**: 자주 조회되는 컬럼에 인덱스 적용
- **커넥션 풀링**: SQLAlchemy 연결 풀 설정
- **캐싱**: Redis를 활용한 API 응답 캐싱
- **비동기 처리**: 긴 작업의 백그라운드 처리

### 프론트엔드 최적화
- **코드 분할**: Next.js 동적 임포트 활용
- **이미지 최적화**: Next.js Image 컴포넌트 사용
- **상태 관리**: 불필요한 리렌더링 방지
- **번들 분석**: webpack-bundle-analyzer 활용

## 🔒 보안 고려사항

### 인증 및 권한
- **JWT 토큰**: 안전한 시크릿 키 사용
- **CORS**: 허용된 오리진만 API 접근
- **Rate Limiting**: API 요청 제한
- **HTTPS**: 프로덕션 환경에서 SSL/TLS 적용

### 데이터 보안
- **민감 정보 암호화**: 데이터베이스 레벨 암호화
- **접근 로그**: 모든 API 접근 기록
- **데이터 백업**: 정기적 백업 및 복구 테스트

## 📚 추가 문서

- [📋 API 명세서](./docs/api_specification.md)
- [🗄️ 데이터베이스 설계](./docs/database_design.md)
- [🔄 시스템 흐름도](./docs/system_flowchart.md)
- [🎯 프로젝트 명세서](./docs/project_specification.md)

## 👥 기여하기

1. **Fork** 이 리포지토리
2. **Feature branch** 생성 (`git checkout -b feature/AmazingFeature`)
3. **Commit** 변경사항 (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Pull Request** 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙋‍♂️ 지원

문제가 발생하거나 질문이 있으시면:

1. **GitHub Issues**: 버그 리포트 및 기능 요청
2. **Wiki**: 자세한 사용법 및 FAQ
3. **Discord**: 실시간 커뮤니티 지원

---

## 🎉 프로젝트 현황

```
✅ 사용자 인증 및 관리 (100%)
✅ 시나리오 CRUD 기능 (100%)
✅ React Flow 플로우차트 에디터 (100%)
✅ 노드 편집 및 TTS 연동 (100%)
✅ 성우 관리 시스템 (90%)
✅ 상태 관리 및 배포 (90%)
✅ 버전 관리 시스템 (90%)
🚧 시뮬레이션 기능 (70%)
🚧 모니터링 대시보드 (60%)
📋 문서화 (80%)
```

**전체 완성도: 약 90%** 🎯

이 시스템으로 손해보험사의 ARS 관리 효율성을 크게 향상시킬 수 있습니다! 🚀
