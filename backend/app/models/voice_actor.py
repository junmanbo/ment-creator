# backend/app/models/voice_actor.py
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy import JSON
from enum import Enum

class GenderType(str, Enum):
    MALE = "male"
    FEMALE = "female"
    NEUTRAL = "neutral"

class AgeRangeType(str, Enum):
    CHILD = "child"
    TWENTIES = "20s"
    THIRTIES = "30s"
    FORTIES = "40s"
    FIFTIES = "50s"
    SENIOR = "senior"

class ModelStatus(str, Enum):
    TRAINING = "training"
    READY = "ready"
    ERROR = "error"
    DEPRECATED = "deprecated"

# 성우 정보
class VoiceActorBase(SQLModel):
    name: str = Field(max_length=100, index=True)
    gender: GenderType
    age_range: AgeRangeType
    language: str = Field(default="ko", max_length=10)
    description: Optional[str] = None
    characteristics: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))  # 음성 특징 (톤, 스타일 등)
    is_active: bool = Field(default=True)

class VoiceActorCreate(VoiceActorBase):
    pass

class VoiceActorUpdate(VoiceActorBase):
    name: Optional[str] = None
    gender: Optional[GenderType] = None
    age_range: Optional[AgeRangeType] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None

class VoiceActor(VoiceActorBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    sample_audio_path: Optional[str] = Field(default=None, max_length=500)
    created_by: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    created_by_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[VoiceActor.created_by]"}
    )
    voice_models: List["VoiceModel"] = Relationship(back_populates="voice_actor")
    voice_samples: List["VoiceSample"] = Relationship(back_populates="voice_actor")

class VoiceActorPublic(VoiceActorBase):
    id: uuid.UUID
    sample_audio_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# 음성 모델
class VoiceModelBase(SQLModel):
    model_name: str = Field(max_length=200)
    model_version: str = Field(default="1.0", max_length=20)
    training_data_duration: Optional[int] = None  # 학습 데이터 시간(초)
    quality_score: Optional[float] = Field(default=None, ge=0, le=100)
    status: ModelStatus = ModelStatus.TRAINING
    config: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))  # 모델 설정

class VoiceModelCreate(VoiceModelBase):
    voice_actor_id: uuid.UUID

class VoiceModelUpdate(VoiceModelBase):
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    status: Optional[ModelStatus] = None
    quality_score: Optional[float] = None

class VoiceModel(VoiceModelBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    voice_actor_id: uuid.UUID = Field(foreign_key="voiceactor.id")
    model_path: str = Field(max_length=500)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    voice_actor: Optional[VoiceActor] = Relationship(back_populates="voice_models")

class VoiceModelPublic(VoiceModelBase):
    id: uuid.UUID
    voice_actor_id: uuid.UUID
    model_path: str
    created_at: datetime
    updated_at: datetime

# 음성 샘플
class VoiceSampleBase(SQLModel):
    text_content: str
    duration: Optional[float] = None  # 초 단위
    sample_rate: int = Field(default=22050)
    file_size: Optional[int] = None  # bytes

class VoiceSampleCreate(VoiceSampleBase):
    voice_actor_id: uuid.UUID

class VoiceSample(VoiceSampleBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    voice_actor_id: uuid.UUID = Field(foreign_key="voiceactor.id")
    audio_file_path: str = Field(max_length=500)
    uploaded_by: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    voice_actor: Optional[VoiceActor] = Relationship(back_populates="voice_samples")
    uploaded_by_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[VoiceSample.uploaded_by]"}
    )

class VoiceSamplePublic(VoiceSampleBase):
    id: uuid.UUID
    voice_actor_id: uuid.UUID
    audio_file_path: str
    created_at: datetime
