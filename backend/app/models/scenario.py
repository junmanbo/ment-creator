import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy import JSON
from enum import Enum
from typing import Union, Literal

class ScenarioStatus(str, Enum):
    DRAFT = "draft"
    TESTING = "testing"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class VersionStatus(str, Enum):
    DRAFT = "draft"
    STABLE = "stable"
    RELEASE = "release"
    DEPRECATED = "deprecated"

class ChangeType(str, Enum):
    ADDED = "added"
    MODIFIED = "modified"
    DELETED = "deleted"
    MOVED = "moved"

class NodeType(str, Enum):
    # 기본 노드 타입
    START = "start"              # 시나리오 시작점
    END = "end"                  # 시나리오 종료점
    
    # ARS 전용 노드 타입
    CONDITION = "condition"      # 조건 분기 (시간체크, 요일체크 등)
    VOICE_MENT = "voice_ment"    # 음성 멘트 재생
    MENU_SELECT = "menu_select"  # 메뉴 선택 (DTMF 입력)
    INPUT_COLLECT = "input_collect"  # 데이터 입력 수집 (생년월일, 전화번호 등)
    EXTERNAL_API = "external_api"    # 외부 시스템 호출 (전문 호출)
    TRANSFER = "transfer"        # 상담사 연결
    
    # 레거시 호환 (삭제 예정)
    MESSAGE = "message"          # voice_ment로 통합 예정
    BRANCH = "branch"           # condition으로 통합 예정  
    INPUT = "input"             # input_collect로 통합 예정

# 조건 분기 타입
class ConditionType(str, Enum):
    TIME_CHECK = "time_check"        # 시간 체크 (09-18시)
    DATE_CHECK = "date_check"        # 날짜/요일 체크 (평일/공휴일)
    VALUE_COMPARE = "value_compare"  # 값 비교 (입력값 검증)
    API_RESULT = "api_result"        # API 호출 결과 분기
    SESSION_DATA = "session_data"    # 세션 데이터 기반 분기

# 입력 수집 타입  
class InputCollectType(str, Enum):
    DTMF_DIGIT = "dtmf_digit"        # DTMF 숫자 입력
    DTMF_STRING = "dtmf_string"      # DTMF 문자열 입력
    VOICE_RECOGNITION = "voice_recognition"  # 음성 인식
    BIRTH_DATE = "birth_date"        # 생년월일 (YYYYMMDD)
    PHONE_NUMBER = "phone_number"    # 전화번호
    BUSINESS_NUMBER = "business_number"  # 사업자번호

# 외부 API 호출 타입
class ExternalApiType(str, Enum):
    HOST_SYSTEM = "host_system"      # 기간계 시스템 호출
    THIRD_PARTY = "third_party"      # 외부 API 호출
    DATABASE_QUERY = "database_query"  # 직접 DB 조회

# 노드별 설정 모델들
class VoiceMentConfig(SQLModel):
    """음성 멘트 재생 노드 설정"""
    text_content: str                    # 멘트 텍스트
    voice_actor_id: Optional[uuid.UUID] = None  # 성우 ID (None이면 기본 음성)
    tts_speed: float = Field(default=1.0)  # 재생 속도 (0.5 ~ 2.0)
    volume: float = Field(default=1.0)     # 음량 (0.0 ~ 1.0)
    repeat_count: int = Field(default=1)   # 반복 횟수
    wait_after: float = Field(default=0.5) # 재생 후 대기 시간 (초)

class ConditionConfig(SQLModel):
    """조건 분기 노드 설정"""
    condition_type: ConditionType
    rules: List[Dict[str, Any]]          # 조건 규칙들
    default_path: Optional[str] = None   # 기본 경로 (모든 조건 실패시)
    
    # 시간 체크 관련
    start_time: Optional[str] = None     # "09:00" 형식
    end_time: Optional[str] = None       # "18:00" 형식
    
    # 요일 체크 관련  
    weekdays: Optional[List[int]] = None # [1,2,3,4,5] (월~금)
    holidays: Optional[List[str]] = None # ["2024-12-25"] 형식
    
    # 값 비교 관련
    variable_name: Optional[str] = None  # 비교할 변수명
    operator: Optional[str] = None       # "eq", "gt", "lt", "in" 등
    compare_value: Optional[Any] = None  # 비교 값

class MenuSelectConfig(SQLModel):
    """메뉴 선택 노드 설정"""
    menu_items: List[Dict[str, Any]]     # 메뉴 항목들
    timeout_seconds: int = Field(default=10)  # 입력 대기 시간
    max_retries: int = Field(default=3)  # 최대 재시도 횟수
    invalid_message: str = "잘못된 번호입니다. 다시 입력해주세요."
    timeout_message: str = "입력 시간이 초과되었습니다."
    
    # 메뉴 항목 예시 구조:
    # [
    #   {"key": "1", "label": "사고접수", "target_node": "accident_report"},
    #   {"key": "2", "label": "자동차 고장출동", "target_node": "car_breakdown"}
    # ]

class InputCollectConfig(SQLModel):
    """입력 수집 노드 설정"""
    input_type: InputCollectType
    variable_name: str                   # 저장할 변수명
    prompt_message: str                  # 입력 안내 멘트
    min_length: int = Field(default=1)   # 최소 입력 길이
    max_length: int = Field(default=20)  # 최대 입력 길이
    timeout_seconds: int = Field(default=15)  # 입력 대기 시간
    max_retries: int = Field(default=3)  # 최대 재시도 횟수
    validation_pattern: Optional[str] = None  # 정규식 패턴
    invalid_message: str = "올바른 형식으로 입력해주세요."
    timeout_message: str = "입력 시간이 초과되었습니다."
    
    # 입력 타입별 특수 설정
    dtmf_terminator: str = Field(default="#")  # DTMF 종료 문자
    inter_digit_timeout: int = Field(default=3)  # 자릿수 간 대기시간

class ExternalApiConfig(SQLModel):
    """외부 API 호출 노드 설정"""
    api_type: ExternalApiType
    endpoint_name: str                   # 호출할 엔드포인트/전문명 (예: "LtrF020")
    request_mapping: Dict[str, Any]      # 요청 데이터 매핑
    response_mapping: Dict[str, str]     # 응답 데이터 매핑 (응답필드 -> 세션변수)
    timeout_seconds: int = Field(default=30)  # API 호출 타임아웃
    retry_count: int = Field(default=1)  # 재시도 횟수
    error_handling: Dict[str, str] = {}  # 에러 코드별 처리 경로
    
    # 기간계 시스템 호출 관련
    host_system_id: Optional[str] = None # 기간계 시스템 ID
    transaction_code: Optional[str] = None # 거래 코드
    
    # 요청 매핑 예시:
    # {
    #   "birth_date": "{session.birth_date}",
    #   "phone_number": "{session.phone_number}",
    #   "system_date": "{current_date}"
    # }

class TransferConfig(SQLModel):
    """상담사 연결 노드 설정"""
    transfer_type: str = "agent"         # "agent", "department", "external"
    destination: str                     # 연결 대상 (내선번호, 부서코드 등)
    queue_music: Optional[str] = None    # 대기음악 파일
    max_wait_time: int = Field(default=300)  # 최대 대기시간 (초)
    overflow_action: str = "voicemail"   # 대기시간 초과시 동작
    priority: int = Field(default=5)     # 우선순위 (1-10)

# 시나리오 기본 정보
class ScenarioBase(SQLModel):
    name: str = Field(max_length=200, index=True)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=100)
    version: str = Field(default="1.0", max_length=20)
    status: ScenarioStatus = ScenarioStatus.DRAFT
    is_template: bool = Field(default=False)
    scenario_metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

class ScenarioCreate(ScenarioBase):
    pass

class ScenarioUpdate(ScenarioBase):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    version: Optional[str] = None
    status: Optional[ScenarioStatus] = None
    is_template: Optional[bool] = None

class Scenario(ScenarioBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by: uuid.UUID = Field(foreign_key="user.id")
    updated_by: Optional[uuid.UUID] = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    created_by_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Scenario.created_by]"}
    )
    updated_by_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Scenario.updated_by]"}
    )
    nodes: List["ScenarioNode"] = Relationship(
        back_populates="scenario",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    connections: List["ScenarioConnection"] = Relationship(
        back_populates="scenario",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    versions: List["ScenarioVersion"] = Relationship(
        back_populates="scenario",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

# 버전 비교 결과
class VersionDiff(SQLModel):
    version_from: str
    version_to: str
    changes: List[Dict[str, Any]]  # 변경 사항 목록
    nodes_added: List[str] = []
    nodes_modified: List[str] = []
    nodes_deleted: List[str] = []
    connections_added: List[str] = []
    connections_modified: List[str] = []
    connections_deleted: List[str] = []
    summary: Dict[str, int]  # 변경 통계

# 버전 롤백 요청
class VersionRollbackRequest(SQLModel):
    target_version_id: uuid.UUID
    create_backup: bool = Field(default=True)
    rollback_notes: Optional[str] = None

# 버전 병합 요청
class VersionMergeRequest(SQLModel):
    source_version_id: uuid.UUID
    target_version_id: uuid.UUID
    merge_strategy: str = Field(default="auto")  # auto, manual, force
    conflict_resolution: Optional[Dict[str, Any]] = None
    merge_notes: Optional[str] = None

class ScenarioPublic(ScenarioBase):
    id: uuid.UUID
    created_by: uuid.UUID
    updated_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

# 시나리오 노드
class ScenarioNodeBase(SQLModel):
    node_id: str = Field(max_length=50, index=True)  # 플로우차트 내 고유 ID
    node_type: NodeType
    name: str = Field(max_length=200)
    position_x: float = Field(default=0)
    position_y: float = Field(default=0)
    config: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

class ScenarioNodeCreate(ScenarioNodeBase):
    scenario_id: uuid.UUID

class ScenarioNodeUpdate(ScenarioNodeBase):
    node_id: Optional[str] = None
    node_type: Optional[NodeType] = None
    name: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    config: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

class ScenarioNode(ScenarioNodeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    scenario_id: uuid.UUID = Field(foreign_key="scenario.id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    scenario: Optional[Scenario] = Relationship(back_populates="nodes")

class ScenarioNodePublic(ScenarioNodeBase):
    id: uuid.UUID
    scenario_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

# 시나리오 연결
class ScenarioConnectionBase(SQLModel):
    source_node_id: str = Field(max_length=50)
    target_node_id: str = Field(max_length=50)
    condition: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    label: Optional[str] = Field(default=None, max_length=100)

class ScenarioConnectionCreate(ScenarioConnectionBase):
    scenario_id: uuid.UUID

class ScenarioConnectionUpdate(ScenarioConnectionBase):
    source_node_id: Optional[str] = None
    target_node_id: Optional[str] = None
    condition: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    label: Optional[str] = None

class ScenarioConnection(ScenarioConnectionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    scenario_id: uuid.UUID = Field(foreign_key="scenario.id")
    created_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    scenario: Optional[Scenario] = Relationship(back_populates="connections")

class ScenarioConnectionPublic(ScenarioConnectionBase):
    id: uuid.UUID
    scenario_id: uuid.UUID
    created_at: datetime

# 시나리오 버전 관리 (강화된 버전)
class ScenarioVersionBase(SQLModel):
    version: str = Field(max_length=20)
    version_status: VersionStatus = VersionStatus.DRAFT
    notes: Optional[str] = None
    tag: Optional[str] = Field(default=None, max_length=50)  # 버전 태그 (예: v1.0-stable, hotfix-001)
    snapshot: Dict[str, Any] = Field(sa_column=Column(JSON))  # 전체 시나리오 스냅샷
    change_summary: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))  # 변경 요약
    auto_generated: bool = Field(default=False)  # 자동 생성 여부

class ScenarioVersionCreate(ScenarioVersionBase):
    scenario_id: uuid.UUID
    auto_create: bool = Field(default=False)  # 자동 버전 생성 여부

class ScenarioVersionUpdate(SQLModel):
    version_status: Optional[VersionStatus] = None
    notes: Optional[str] = None
    tag: Optional[str] = None

class ScenarioVersion(ScenarioVersionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    scenario_id: uuid.UUID = Field(foreign_key="scenario.id")
    created_by: uuid.UUID = Field(foreign_key="user.id")
    parent_version_id: Optional[uuid.UUID] = Field(default=None, foreign_key="scenarioversion.id")  # 부모 버전 (self-reference)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    scenario: Optional[Scenario] = Relationship(back_populates="versions")
    created_by_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[ScenarioVersion.created_by]"}
    )
    # Self-referential relationship: 부모 버전 참조
    parent_version: Optional["ScenarioVersion"] = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[ScenarioVersion.parent_version_id]",
            "remote_side": "[ScenarioVersion.id]"
        }
    )

class ScenarioVersionPublic(ScenarioVersionBase):
    id: uuid.UUID
    scenario_id: uuid.UUID
    created_by: uuid.UUID
    parent_version_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

# 시나리오 전체 구조 (노드 + 연결 포함)
class ScenarioWithDetails(ScenarioPublic):
    nodes: List[ScenarioNodePublic] = []
    connections: List[ScenarioConnectionPublic] = []

# 시나리오 시뮬레이션
class ScenarioSimulationBase(SQLModel):
    start_node_id: str = Field(max_length=50)
    simulation_config: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

class ScenarioSimulationCreate(ScenarioSimulationBase):
    scenario_id: uuid.UUID

class ScenarioSimulation(ScenarioSimulationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    scenario_id: uuid.UUID = Field(foreign_key="scenario.id")
    current_node_id: Optional[str] = Field(default=None, max_length=50)
    session_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    status: str = Field(default="running", max_length=20)  # running, completed, failed
    started_by: uuid.UUID = Field(foreign_key="user.id")
    started_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    
    # 관계 정의
    scenario: Optional[Scenario] = Relationship()
    started_by_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[ScenarioSimulation.started_by]"}
    )

class ScenarioSimulationPublic(ScenarioSimulationBase):
    id: uuid.UUID
    scenario_id: uuid.UUID
    current_node_id: Optional[str] = None
    session_data: Optional[Dict[str, Any]] = None
    status: str
    started_by: uuid.UUID
    started_at: datetime
    completed_at: Optional[datetime] = None
