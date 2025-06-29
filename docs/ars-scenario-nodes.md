# 🎭 ARS 시나리오 노드 타입 상세 가이드

> 콜센터 ARS 시나리오에서 사용되는 노드 타입별 상세 설정 및 구현 가이드

## 📋 목차

1. [노드 타입 개요](#노드-타입-개요)
2. [기본 노드](#기본-노드)
3. [ARS 전용 노드](#ars-전용-노드)
4. [노드 연결 및 흐름 제어](#노드-연결-및-흐름-제어)
5. [실제 시나리오 예시](#실제-시나리오-예시)

---

## 노드 타입 개요

ARS 시나리오는 다음 7가지 핵심 노드 타입으로 구성됩니다:

| 노드 타입 | 용도 | 주요 기능 |
|----------|------|-----------|
| `START` | 시작점 | 시나리오 진입점 |
| `CONDITION` | 조건 분기 | 시간/날짜/값 조건 체크 |
| `VOICE_MENT` | 음성 멘트 | TTS/음성파일 재생 |
| `MENU_SELECT` | 메뉴 선택 | DTMF 메뉴 처리 |
| `INPUT_COLLECT` | 입력 수집 | 고객 정보 수집 |
| `EXTERNAL_API` | 외부 호출 | 기간계/API 연동 |
| `TRANSFER` | 상담사 연결 | 호전환 처리 |

---

## 기본 노드

### START (시작점)

```python
NodeType.START
```

**설명**: 시나리오의 진입점으로, 고객이 전화를 걸었을 때 최초로 실행되는 노드입니다.

**설정**:
- 별도 설정 불필요 (자동 실행)
- 시나리오당 하나만 존재

**사용 예시**:
```json
{
  "node_type": "start",
  "name": "영업시간 시나리오 시작",
  "position": {"x": 100, "y": 100}
}
```

### END (종료점)

```python
NodeType.END
```

**설명**: 시나리오 종료점으로, 통화를 종료하거나 다른 시나리오로 이동할 때 사용합니다.

---

## ARS 전용 노드

### 1. CONDITION (조건 분기)

```python
NodeType.CONDITION
```

**설명**: 시간, 날짜, 변수 값 등의 조건에 따라 흐름을 분기하는 노드입니다.

#### 조건 타입별 설정

##### 시간 체크 (TIME_CHECK)
```json
{
  "condition_type": "time_check",
  "start_time": "09:00",
  "end_time": "18:00",
  "rules": [
    {
      "condition": "within_hours",
      "target_node": "business_hours_menu",
      "label": "영업시간 내"
    },
    {
      "condition": "outside_hours", 
      "target_node": "after_hours_message",
      "label": "영업시간 외"
    }
  ]
}
```

##### 요일/날짜 체크 (DATE_CHECK)
```json
{
  "condition_type": "date_check",
  "weekdays": [1, 2, 3, 4, 5],  // 월~금
  "holidays": ["2024-12-25", "2024-01-01"],
  "rules": [
    {
      "condition": "is_business_day",
      "target_node": "weekday_flow",
      "label": "평일"
    },
    {
      "condition": "is_weekend_or_holiday",
      "target_node": "weekend_flow", 
      "label": "주말/공휴일"
    }
  ]
}
```

##### 값 비교 (VALUE_COMPARE)
```json
{
  "condition_type": "value_compare",
  "variable_name": "customer_grade",
  "rules": [
    {
      "operator": "eq",
      "compare_value": "VIP",
      "target_node": "vip_service",
      "label": "VIP 고객"
    },
    {
      "operator": "in",
      "compare_value": ["GOLD", "SILVER"],
      "target_node": "premium_service",
      "label": "우대 고객"
    }
  ],
  "default_path": "general_service"
}
```

### 2. VOICE_MENT (음성 멘트)

```python
NodeType.VOICE_MENT
```

**설명**: TTS 또는 녹음된 음성 파일을 재생하는 노드입니다.

#### 설정 구조
```json
{
  "text_content": "메뉴 개수는 6개입니다. 사고접수는 1번, 자동차 고장출동은 2번...",
  "voice_actor_id": "uuid-of-voice-actor",  // null이면 기본 음성
  "tts_speed": 1.0,        // 0.5 ~ 2.0
  "volume": 1.0,           // 0.0 ~ 1.0
  "repeat_count": 1,       // 반복 횟수
  "wait_after": 0.5        // 재생 후 대기 시간(초)
}
```

#### Voice Cloning 설정
- **voice_actor_id**: 성우 ID 지정시 다중 참조 Voice Cloning 적용
- **자동 최적화**: 최대 3개 참조 음성으로 GPU 메모리 최적화
- **Fallback**: Voice Cloning 실패시 기본 음성으로 자동 전환

### 3. MENU_SELECT (메뉴 선택)

```python
NodeType.MENU_SELECT  
```

**설명**: DTMF 입력을 통해 고객이 메뉴를 선택할 수 있는 노드입니다.

#### 설정 구조
```json
{
  "menu_items": [
    {
      "key": "1",
      "label": "사고접수",
      "target_node": "accident_report_flow"
    },
    {
      "key": "2", 
      "label": "자동차 고장출동",
      "target_node": "breakdown_service_flow"
    },
    {
      "key": "3",
      "label": "신규가입상담", 
      "target_node": "signup_consultation_flow"
    },
    {
      "key": "0",
      "label": "상담사 연결",
      "target_node": "agent_transfer"
    }
  ],
  "timeout_seconds": 10,
  "max_retries": 3,
  "invalid_message": "잘못된 번호입니다. 다시 입력해주세요.",
  "timeout_message": "입력 시간이 초과되었습니다."
}
```

### 4. INPUT_COLLECT (입력 수집)

```python
NodeType.INPUT_COLLECT
```

**설명**: 고객으로부터 생년월일, 전화번호 등의 정보를 수집하는 노드입니다.

#### 입력 타입별 설정

##### 생년월일 수집
```json
{
  "input_type": "birth_date",
  "variable_name": "customer_birth_date",
  "prompt_message": "생년월일 8자리를 입력해주세요. 예시: 19900101",
  "min_length": 8,
  "max_length": 8,
  "validation_pattern": "^(19|20)\\d{6}$",
  "timeout_seconds": 15,
  "max_retries": 3,
  "invalid_message": "올바른 생년월일 8자리를 입력해주세요.",
  "dtmf_terminator": "#"
}
```

##### 전화번호 수집
```json
{
  "input_type": "phone_number",
  "variable_name": "customer_phone",
  "prompt_message": "휴대폰 번호 11자리를 입력해주세요.",
  "min_length": 11,
  "max_length": 11,
  "validation_pattern": "^010\\d{8}$",
  "timeout_seconds": 20,
  "max_retries": 3,
  "invalid_message": "올바른 휴대폰 번호를 입력해주세요."
}
```

##### 일반 숫자 입력
```json
{
  "input_type": "dtmf_digit",
  "variable_name": "contract_number",
  "prompt_message": "계약번호를 입력하고 우물정자를 눌러주세요.",
  "min_length": 1,
  "max_length": 20,
  "timeout_seconds": 30,
  "dtmf_terminator": "#",
  "inter_digit_timeout": 3
}
```

### 5. EXTERNAL_API (외부 시스템 호출)

```python
NodeType.EXTERNAL_API
```

**설명**: 기간계 시스템 전문 호출이나 외부 API 연동을 수행하는 노드입니다.

#### 기간계 시스템 호출 예시
```json
{
  "api_type": "host_system",
  "endpoint_name": "LtrF020",
  "host_system_id": "CORE_INSURANCE",
  "transaction_code": "CONTRACT_INQUIRY",
  "request_mapping": {
    "birth_date": "{session.customer_birth_date}",
    "phone_number": "{session.customer_phone}",
    "system_date": "{current_date}",
    "inquiry_type": "01"
  },
  "response_mapping": {
    "contract_list": "session.customer_contracts",
    "customer_name": "session.customer_name",
    "customer_grade": "session.customer_grade"
  },
  "timeout_seconds": 30,
  "retry_count": 2,
  "error_handling": {
    "E001": "no_contract_found",
    "E002": "system_error_flow",
    "timeout": "api_timeout_flow"
  }
}
```

#### 외부 API 호출 예시
```json
{
  "api_type": "third_party",
  "endpoint_name": "weather_api",
  "request_mapping": {
    "location": "{session.customer_location}",
    "api_key": "{config.weather_api_key}"
  },
  "response_mapping": {
    "weather_info": "session.current_weather"
  },
  "timeout_seconds": 10
}
```

### 6. TRANSFER (상담사 연결)

```python
NodeType.TRANSFER
```

**설명**: 고객을 상담사나 특정 부서로 연결하는 노드입니다.

#### 설정 구조
```json
{
  "transfer_type": "agent",
  "destination": "1001",  // 내선번호 또는 부서코드
  "queue_music": "hold_music_01.wav",
  "max_wait_time": 300,   // 5분
  "overflow_action": "voicemail",
  "priority": 5,          // 1(최고) ~ 10(최저)
  "department_info": {
    "name": "사고접수팀",
    "hours": "09:00-18:00"
  }
}
```

#### 전환 타입별 설정

##### 일반 상담사 연결
```json
{
  "transfer_type": "agent",
  "destination": "general_queue",
  "priority": 5
}
```

##### 특정 부서 연결  
```json
{
  "transfer_type": "department",
  "destination": "accident_dept",
  "priority": 3
}
```

##### 외부 번호 연결
```json
{
  "transfer_type": "external", 
  "destination": "02-1234-5678",
  "max_wait_time": 60
}
```

---

## 노드 연결 및 흐름 제어

### 연결 설정 구조
```json
{
  "source_node_id": "menu_main",
  "target_node_id": "accident_flow", 
  "condition": {
    "type": "dtmf_input",
    "value": "1"
  },
  "label": "사고접수 선택"
}
```

### 조건부 연결
```json
{
  "source_node_id": "time_check",
  "target_node_id": "business_hours_menu",
  "condition": {
    "type": "condition_result",
    "path": "within_hours"
  },
  "label": "영업시간 내"
}
```

---

## 실제 시나리오 예시

### 영업시간 메인 시나리오

```json
{
  "scenario_name": "영업시간 메인 시나리오",
  "description": "평일 09-18시 정규 영업시간 ARS 처리",
  "nodes": [
    {
      "node_id": "start_main",
      "node_type": "start",
      "name": "시나리오 시작"
    },
    {
      "node_id": "check_business_day", 
      "node_type": "condition",
      "name": "영업일 확인",
      "config": {
        "condition_type": "date_check",
        "weekdays": [1, 2, 3, 4, 5],
        "holidays": ["2024-12-25"]
      }
    },
    {
      "node_id": "check_business_hours",
      "node_type": "condition", 
      "name": "영업시간 확인",
      "config": {
        "condition_type": "time_check",
        "start_time": "09:00",
        "end_time": "18:00"
      }
    },
    {
      "node_id": "main_menu_ment",
      "node_type": "voice_ment",
      "name": "메인 메뉴 안내",
      "config": {
        "text_content": "메뉴 개수는 6개입니다. 사고접수는 1번, 자동차 고장출동은 2번, 신규가입상담은 3번, 질병상해계약 관리는 4번, 대출상담은 5번, 상담사 연결은 6번을 눌러주십시오.",
        "voice_actor_id": "professional_female_voice"
      }
    },
    {
      "node_id": "main_menu_select",
      "node_type": "menu_select",
      "name": "메인 메뉴 선택", 
      "config": {
        "menu_items": [
          {"key": "1", "label": "사고접수", "target_node": "accident_input"},
          {"key": "2", "label": "자동차 고장출동", "target_node": "breakdown_input"},
          {"key": "3", "label": "신규가입상담", "target_node": "signup_transfer"},
          {"key": "4", "label": "질병상해계약 관리", "target_node": "contract_input"},
          {"key": "5", "label": "대출상담", "target_node": "loan_transfer"},
          {"key": "6", "label": "상담사 연결", "target_node": "agent_transfer"}
        ]
      }
    },
    {
      "node_id": "contract_input",
      "node_type": "input_collect",
      "name": "고객 정보 수집",
      "config": {
        "input_type": "birth_date",
        "variable_name": "customer_birth_date",
        "prompt_message": "계약 조회를 위해 생년월일 8자리를 입력해주세요."
      }
    },
    {
      "node_id": "contract_api_call",
      "node_type": "external_api", 
      "name": "계약 조회",
      "config": {
        "endpoint_name": "LtrF020",
        "request_mapping": {
          "birth_date": "{session.customer_birth_date}",
          "phone_number": "{caller_id}"
        },
        "response_mapping": {
          "contract_list": "session.contracts"
        }
      }
    }
  ],
  "connections": [
    {
      "source_node_id": "start_main",
      "target_node_id": "check_business_day"
    },
    {
      "source_node_id": "check_business_day",
      "target_node_id": "check_business_hours",
      "condition": {"path": "is_business_day"}
    },
    {
      "source_node_id": "check_business_hours", 
      "target_node_id": "main_menu_ment",
      "condition": {"path": "within_hours"}
    },
    {
      "source_node_id": "main_menu_ment",
      "target_node_id": "main_menu_select"
    }
  ]
}
```

---

## 💡 개발 팁

### 1. 노드 설계 원칙
- **단일 책임**: 각 노드는 하나의 명확한 역할만 수행
- **재사용성**: 공통 로직은 별도 노드로 분리
- **오류 처리**: 모든 노드에 실패시 대체 경로 설정

### 2. 성능 최적화
- **TTS 캐싱**: 동일한 멘트는 캐시 활용
- **API 타임아웃**: 외부 호출시 적절한 타임아웃 설정
- **메모리 관리**: Voice Cloning시 참조 음성 개수 제한

### 3. 사용자 경험
- **직관적 메뉴**: 번호와 기능의 논리적 연관성
- **명확한 안내**: 각 단계별 상세하고 친절한 안내
- **빠른 처리**: 불필요한 대기시간 최소화

---

**📞 관련 문서**
- [시나리오 에디터 사용법](./flowchart-editor.md)
- [TTS 시스템 가이드](./tts-integration.md)
- [API 연동 가이드](./api-specification.md)