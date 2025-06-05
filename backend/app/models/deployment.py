import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy import JSON
from enum import Enum

class DeploymentEnvironment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class DeploymentStatus(str, Enum):
    PENDING = "pending"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"

# Deployment Base
class DeploymentBase(SQLModel):
    environment: DeploymentEnvironment
    version: str
    config: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    rollback_version: Optional[str] = None

class DeploymentCreate(DeploymentBase):
    scenario_id: uuid.UUID

class DeploymentUpdate(SQLModel):
    environment: Optional[DeploymentEnvironment] = None
    version: Optional[str] = None
    status: Optional[DeploymentStatus] = None
    config: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    rollback_version: Optional[str] = None
    error_message: Optional[str] = None

class Deployment(DeploymentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    scenario_id: uuid.UUID = Field(foreign_key="scenario.id")
    status: DeploymentStatus = DeploymentStatus.PENDING
    deployed_by: uuid.UUID = Field(foreign_key="user.id")
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    scenario: Optional["Scenario"] = Relationship()
    deployed_by_user: Optional["User"] = Relationship()
    deployment_history: List["DeploymentHistory"] = Relationship(back_populates="deployment")
    approvals: List["DeploymentApproval"] = Relationship(back_populates="deployment")

class DeploymentPublic(DeploymentBase):
    id: uuid.UUID
    scenario_id: uuid.UUID
    status: DeploymentStatus
    deployed_by: uuid.UUID
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

# Deployment History
class DeploymentHistoryBase(SQLModel):
    action: str  # deploy, rollback, pause, resume
    description: Optional[str] = None
    deployment_metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

class DeploymentHistory(DeploymentHistoryBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    deployment_id: uuid.UUID = Field(foreign_key="deployment.id")
    performed_by: uuid.UUID = Field(foreign_key="user.id")
    performed_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    deployment: Optional[Deployment] = Relationship(back_populates="deployment_history")
    performed_by_user: Optional["User"] = Relationship()

# Deployment Approval
class DeploymentApprovalBase(SQLModel):
    required_role: str = "manager"  # manager, admin
    is_required: bool = True

class DeploymentApproval(DeploymentApprovalBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    deployment_id: uuid.UUID = Field(foreign_key="deployment.id")
    approved_by: Optional[uuid.UUID] = Field(foreign_key="user.id", default=None)
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    deployment: Optional[Deployment] = Relationship(back_populates="approvals")
    approved_by_user: Optional["User"] = Relationship()

# Approval Record (for tracking individual approval steps)
class ApprovalRecord(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    deployment_id: uuid.UUID = Field(foreign_key="deployment.id")
    step_name: str  # "manager_approval", "admin_approval", "final_approval"
    step_order: int
    required_role: str
    approved_by: Optional[uuid.UUID] = Field(foreign_key="user.id", default=None)
    status: str = "pending"  # pending, approved, rejected
    approved_at: Optional[datetime] = None
    comments: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    approved_by_user: Optional["User"] = Relationship()
