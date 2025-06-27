# 🚀 API 빠른 참조 가이드

> 개발 중 자주 사용하는 API 엔드포인트들의 빠른 참조

## 🔐 인증 API

### 로그인
```http
POST /api/v1/login
Content-Type: application/json

{
  "username": "test@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "test@example.com",
    "full_name": "Test User"
  }
}
```

### 사용자 등록
```http
POST /api/v1/register
Content-Type: application/json

{
  "username": "newuser@example.com",
  "password": "password123",
  "full_name": "New User"
}
```

## 🎭 성우 관리 API

### 성우 목록 조회
```http
GET /api/v1/voice-actors?limit=20&skip=0
Authorization: Bearer {token}

Response:
[
  {
    "id": "uuid",
    "name": "김소연",
    "gender": "female",
    "age_range": "30s",
    "language": "ko",
    "description": "친근하고 따뜻한 목소리",
    "is_active": true,
    "created_at": "2025-06-28T10:00:00Z"
  }
]
```

### 성우 등록
```http
POST /api/v1/voice-actors
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "박민수",
  "gender": "male",
  "age_range": "40s",
  "language": "ko",
  "description": "차분하고 신뢰감 있는 목소리",
  "characteristics": {
    "tone": "차분함",
    "style": "신뢰감",
    "specialty": "금융업계"
  }
}
```

### 음성 샘플 업로드
```http
POST /api/v1/voice-actors/{actor_id}/samples
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- audio_file: (audio file)
- text_content: "안녕하세요. 반갑습니다."
```

### 음성 샘플 재생
```http
GET /api/v1/voice-actors/{actor_id}/samples/{sample_id}/audio
Authorization: Bearer {token}

Response: audio/wav stream
```

## 🤖 TTS 생성 API

### TTS 스크립트 생성
```http
POST /api/v1/voice-actors/tts-scripts
Authorization: Bearer {token}
Content-Type: application/json

{
  "text_content": "안녕하세요. OO손해보험입니다.",
  "voice_actor_id": "uuid",
  "voice_settings": {
    "speed": 1.0,
    "tone": "friendly",
    "emotion": "bright"
  }
}

Response:
{
  "id": "uuid",
  "text_content": "안녕하세요. OO손해보험입니다.",
  "voice_actor_id": "uuid",
  "created_at": "2025-06-28T10:00:00Z"
}
```

### TTS 생성 요청
```http
POST /api/v1/voice-actors/tts-scripts/{script_id}/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "script_id": "uuid",
  "voice_model_id": "uuid",
  "generation_params": {
    "quality": "high",
    "format": "wav"
  }
}

Response:
{
  "id": "uuid",
  "script_id": "uuid",
  "status": "pending",
  "created_at": "2025-06-28T10:00:00Z"
}
```

### TTS 생성 상태 조회
```http
GET /api/v1/voice-actors/tts-generations/{generation_id}
Authorization: Bearer {token}

Response:
{
  "id": "uuid",
  "script_id": "uuid",
  "status": "completed",
  "audio_file_path": "/audio/generated/tts_123.wav",
  "file_size": 1234567,
  "duration": 12.5,
  "quality_score": 92.3,
  "started_at": "2025-06-28T10:00:00Z",
  "completed_at": "2025-06-28T10:00:30Z"
}
```

### 생성된 TTS 오디오 재생
```http
GET /api/v1/voice-actors/tts-generations/{generation_id}/audio
Authorization: Bearer {token}

Response: audio/wav stream
```

## 📊 시나리오 관리 API (구현 예정)

### 시나리오 목록 조회
```http
GET /api/v1/scenarios?status=active&category=보험접수
Authorization: Bearer {token}

Response:
[
  {
    "id": "uuid",
    "name": "자동차보험 접수",
    "description": "자동차 보험 접수 관련 ARS 시나리오",
    "category": "보험접수",
    "version": "2.1",
    "status": "active",
    "created_at": "2025-06-01T09:00:00Z",
    "updated_at": "2025-06-20T14:00:00Z"
  }
]
```

### 시나리오 생성
```http
POST /api/v1/scenarios
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "생명보험 상담",
  "description": "생명보험 관련 상담 시나리오",
  "category": "보험상담",
  "is_template": false,
  "metadata": {
    "expected_duration": 240,
    "complexity": "high"
  }
}
```

### 시나리오 상세 조회
```http
GET /api/v1/scenarios/{scenario_id}
Authorization: Bearer {token}

Response:
{
  "id": "uuid",
  "name": "자동차보험 접수",
  "description": "자동차 보험 접수 관련 ARS 시나리오",
  "version": "2.1",
  "status": "active",
  "nodes": [
    {
      "id": "uuid",
      "node_id": "start_001",
      "node_type": "start",
      "name": "시작",
      "position_x": 100,
      "position_y": 100,
      "config": {}
    },
    {
      "id": "uuid",
      "node_id": "msg_001", 
      "node_type": "message",
      "name": "환영 인사",
      "position_x": 300,
      "position_y": 100,
      "config": {
        "text": "안녕하세요. OO손해보험입니다.",
        "voice_actor_id": "uuid"
      }
    }
  ],
  "connections": [
    {
      "id": "uuid",
      "source_node_id": "start_001",
      "target_node_id": "msg_001",
      "condition": null,
      "label": ""
    }
  ]
}
```

## 📝 멘트 관리 API

### 멘트 목록 조회
```http
GET /api/v1/ments?limit=20&skip=0
Authorization: Bearer {token}

Response:
[
  {
    "id": "uuid",
    "title": "환영 인사",
    "sub_title": "콜센터 기본 인사",
    "content": "안녕하세요. OO손해보험입니다.",
    "file_path": "/audio/ments/welcome.wav",
    "created_dt": "2025-06-28T10:00:00Z"
  }
]
```

### 멘트 생성
```http
POST /api/v1/ments
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "새로운 멘트",
  "sub_title": "부제목",
  "content": "멘트 내용",
  "voice_actor_id": "uuid",
  "voice_settings": {
    "speed": 1.0,
    "tone": "friendly"
  }
}
```

### 멘트 오디오 스트리밍
```http
GET /api/v1/ments/{ment_id}/audio
Authorization: Bearer {token}

Response: audio/wav stream
```

## 🔧 개발 유틸리티

### API 문서 (Swagger)
```
http://localhost:8000/docs
```

### 헬스체크
```http
GET /api/v1/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-06-28T10:00:00Z",
  "version": "1.0.0"
}
```

### 사용자 정보 조회
```http
GET /api/v1/users/me
Authorization: Bearer {token}

Response:
{
  "id": "uuid",
  "username": "user@example.com",
  "full_name": "User Name",
  "created_at": "2025-06-01T00:00:00Z"
}
```

## 🚨 에러 응답 형식

### 일반적인 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "voice_actor_id",
      "issue": "required field missing"
    }
  },
  "timestamp": "2025-06-28T10:00:00Z",
  "request_id": "req_123456789"
}
```

### 주요 에러 코드
- `AUTHENTICATION_FAILED` (401): 인증 실패
- `AUTHORIZATION_DENIED` (403): 권한 없음
- `VALIDATION_ERROR` (422): 입력 값 검증 오류
- `RESOURCE_NOT_FOUND` (404): 리소스를 찾을 수 없음
- `TTS_GENERATION_FAILED` (500): TTS 생성 실패
- `INTERNAL_SERVER_ERROR` (500): 내부 서버 오류

## 💡 개발 팁

### 인증 토큰 테스트
```bash
# 로그인 후 토큰 저장
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# API 테스트
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/v1/voice-actors
```

### 파일 업로드 테스트
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio_file=@sample.wav" \
  -F "text_content=안녕하세요" \
  http://localhost:8000/api/v1/voice-actors/{actor_id}/samples
```

### 상태 폴링 예시 (JavaScript)
```javascript
async function pollTTSStatus(generationId) {
  while (true) {
    const response = await fetch(`/api/v1/voice-actors/tts-generations/${generationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.status === 'completed' || data.status === 'failed') {
      return data;
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
  }
}
```

---

**💡 빠른 접근**: 개발 중 이 문서를 즐겨찾기에 추가하여 API 호출 시 빠르게 참조하세요!