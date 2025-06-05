import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy import JSON
from enum import Enum
from typing import Union

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
    START = "start"
    MESSAGE = "message"
    BRANCH = "branch"
    TRANSFER = "transfer"
    END = "end"
    INPUT = "input"

# 시나리오 기본 정보
class ScenarioBase(SQLModel):
    name: str = Field(max_length=200, index=True)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=100)
    version: str = Field(default="1.0", max_length=20)
    status: ScenarioStatus = ScenarioStatus.DRAFT
    is_template: bool = Field(default=False)
    metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

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
    deployed_at: Optional[datetime] = None
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
    deployed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

# 시나리오 노드
class ScenarioNodeBase(SQLModel):
    node_id: str = Field(max_length=50, index=True)  # 플로우차트 내 고유 ID
    node_type: NodeType
    name: str = Field(max_length=200)
    position_x: float = Field(default=0)
    position_y: float = Field(default=0)
    config: Optional[Dict[str, Any]] = Field(default_factory=dict, sa_column=Column(JSON))

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
