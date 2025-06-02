# 🎭 손해보험 콜센터 ARS 시나리오 관리 시스템

손해보험사 콜센터의 ARS(자동응답시스템) 시나리오를 효율적으로 관리하고, Voice Cloning 기술을 활용한 고품질 TTS 멘트를 생성하는 통합 관리 시스템입니다.

## ✨ 주요 기능

### 🎯 ARS 시나리오 관리
- **드래그앤드롭 플로우차트 에디터**: React Flow 기반 직관적인 시나리오 설계
- **시나리오 버전 관리**: 변경 이력 추적 및 롤백 기능
- **실시간 시뮬레이션**: 배포 전 시나리오 테스트 및 검증
- **노드 타입**: 시작, 메시지, 분기, 상담원 연결, 입력, 종료

### 🎤 성우 및 음성 관리
- **성우 프로필 관리**: 성별, 연령대, 음성 특성별 분류
- **Voice Cloning TTS**: 실제 성우 음성 기반 고품질 TTS 생성
- **음성 샘플 라이브러리**: 재사용 가능한 음성 파일 관리
- **실시간 음성 미리보기**: 생성된 TTS 즉시 재생

### 📊 모니터링 및 분석
- **TTS 생성 현황**: 실시간 생성 상태 및 품질 점수 추적
- **시나리오 사용 통계**: 배포 현황 및 성능 지표
- **사용자 활동 로그**: 시스템 사용 이력 및 감사 추적

## 🛠️ 기술 스택

### 백엔드
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+ with SQLModel
- **Authentication**: JWT + OAuth2
- **TTS Engine**: Coqui XTTS v2 (Voice Cloning)
- **API Documentation**: Swagger/OpenAPI 3.0

### 프론트엔드
- **Framework**: Next.js 15 + React 18 + TypeScript
- **State Management**: Redux Toolkit
- **UI Library**: shadcn/ui + Tailwind CSS
- **Flow Editor**: @xyflow/react v12
- **Icons**: Lucide React

### 인프라
- **Containerization**: Docker + Docker Compose
- **Audio Processing**: librosa, soundfile
- **File Storage**: 로컬 파일 시스템 (확장 가능)

## 🚀 설치 및 실행

### 사전 요구사항
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Git

### 1. 저장소 클론
```bash
git clone <repository-url>
cd ment-creator
```

### 2. 백엔드 설정
```bash
cd backend

# Python 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 설정

# 데이터베이스 마이그레이션
alembic upgrade head

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 프론트엔드 설정
```bash
cd frontend/ment-gen

# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# API URL 확인: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# 개발 서버 실행
npm run dev
```

### 4. TTS 모듈 설정 (선택사항)
```bash
cd tts_coqui

# TTS 의존성 설치
pip install TTS torch torchaudio librosa soundfile

# 모델 다운로드 (최초 실행 시 자동)
python -c "from TTS.api import TTS; TTS('tts_models/multilingual/multi-dataset/xtts_v2')"
```

## 📱 사용 방법

### 1. 시나리오 생성 및 편집
1. **시나리오 관리** 메뉴에서 "새 시나리오" 클릭
2. 기본 정보 입력 (이름, 설명, 카테고리)
3. 드래그앤드롭으로 노드 배치 및 연결
4. 각 노드별 설정 (메시지 내용, 분기 조건 등)
5. 저장 후 시뮬레이션으로 테스트

### 2. 성우 관리 및 TTS 생성
1. **성우 관리** 메뉴에서 성우 등록
2. 음성 샘플 업로드 (학습용)
3. **TTS 생성** 탭에서 텍스트 입력
4. 성우 선택 후 음성 생성
5. 생성된 음성 미리보기 및 다운로드

### 3. 시나리오 시뮬레이션
1. 시나리오 목록에서 **시뮬레이션** 버튼 클릭
2. 고객 관점에서 ARS 흐름 체험
3. 분기 옵션 선택하여 다양한 경로 테스트
4. 시뮬레이션 로그로 전체 흐름 확인

## 🏗️ 프로젝트 구조

```
ment-creator/
├── backend/                # FastAPI 백엔드
│   ├── app/
│   │   ├── api/           # API 라우터
│   │   ├── models/        # SQLModel 데이터 모델
│   │   ├── services/      # 비즈니스 로직
│   │   └── core/          # 설정 및 유틸리티
│   └── alembic/           # 데이터베이스 마이그레이션
├── frontend/              # Next.js 프론트엔드
│   └── ment-gen/
│       ├── app/           # Next.js 13+ App Router
│       │   ├── scenarios/ # 시나리오 관리 페이지
│       │   └── voice-actors/ # 성우 관리 페이지
│       └── components/    # 재사용 가능한 컴포넌트
└── tts_coqui/            # TTS 모듈 (Coqui XTTS)
```

## 🎯 주요 API 엔드포인트

### 시나리오 관리
- `GET /api/v1/scenarios` - 시나리오 목록 조회
- `POST /api/v1/scenarios` - 새 시나리오 생성
- `GET /api/v1/scenarios/{id}` - 시나리오 상세 조회
- `POST /api/v1/scenarios/{id}/nodes` - 노드 추가
- `POST /api/v1/scenarios/{id}/simulate` - 시뮬레이션 시작

### 성우 및 TTS 관리
- `GET /api/v1/voice-actors` - 성우 목록 조회
- `POST /api/v1/voice-actors` - 새 성우 등록
- `POST /api/v1/voice-actors/tts-scripts` - TTS 스크립트 생성
- `POST /api/v1/voice-actors/tts-scripts/{id}/generate` - TTS 생성

### 인증
- `POST /api/v1/login` - 사용자 로그인
- `POST /api/v1/register` - 사용자 등록

## 🔧 개발 팁

### React Flow 커스터마이징
```tsx
// 커스텀 노드 타입 정의
const nodeTypes: NodeTypes = {
  start: StartNode,
  message: MessageNode,
  branch: BranchNode,
  // ...
}

// 노드 연결 시 유효성 검사
const isValidConnection = (connection: Connection) => {
  // 커스텀 검증 로직
  return true
}
```

### TTS 품질 최적화
```python
# 고품질 TTS 생성 설정
tts_config = {
    "temperature": 0.7,
    "length_penalty": 1.0,
    "repetition_penalty": 1.1,
    "split_sentences": True
}
```

## 📊 성능 지표

- **TTS 생성 시간**: 평균 15-30초 (텍스트 길이에 따라)
- **시나리오 로드 시간**: < 2초
- **동시 사용자 지원**: 50+ (기본 설정)
- **TTS 품질 점수**: 90+ (전문 성우 기준)

## 🤝 기여 방법

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원 및 문의

- 이슈 리포트: [GitHub Issues](https://github.com/your-repo/issues)
- 문서: [API Documentation](http://localhost:8000/docs)
- 이메일: your-email@company.com

---

⭐ 이 프로젝트가 도움이 되셨다면 스타를 눌러주세요!
