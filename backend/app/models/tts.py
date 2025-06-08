# backend/app/models/tts.py
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy import JSON
from enum import Enum

class GenerationStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# TTS 스크립트 (멘트 내용 + 설정)
class TTSScriptBase(SQLModel):
    text_content: str
    voice_settings: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))  # 속도, 톤, 감정 설정

class TTSScriptCreate(TTSScriptBase):
    voice_actor_id: Optional[uuid.UUID] = None

class TTSScriptUpdate(TTSScriptBase):
    text_content: Optional[str] = None
    voice_actor_id: Optional[uuid.UUID] = None

class TTSScript(TTSScriptBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    voice_actor_id: Optional[uuid.UUID] = Field(foreign_key="voiceactor.id")
    created_by: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    voice_actor: Optional["VoiceActor"] = Relationship()
    created_by_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[TTSScript.created_by]"}
    )
    generations: List["TTSGeneration"] = Relationship(back_populates="script")

class TTSScriptPublic(TTSScriptBase):
    id: uuid.UUID
    voice_actor_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

# TTS 생성 작업
class TTSGenerationBase(SQLModel):
    generation_params: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))  # 생성 파라미터

class TTSGenerateRequest(SQLModel):
    script_id: uuid.UUID
    generation_params: Optional[Dict[str, Any]] = None

class TTSGeneration(TTSGenerationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    script_id: uuid.UUID = Field(foreign_key="ttsscript.id")
    audio_file_path: Optional[str] = Field(default=None, max_length=500)
    file_size: Optional[int] = None  # bytes
    duration: Optional[float] = None  # 초 단위
    quality_score: Optional[float] = Field(default=None, ge=0, le=100)
    status: GenerationStatus = GenerationStatus.PENDING
    error_message: Optional[str] = None
    requested_by: uuid.UUID = Field(foreign_key="user.id")
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    script: Optional[TTSScript] = Relationship(back_populates="generations")
    requested_by_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[TTSGeneration.requested_by]"}
    )

class TTSGenerationPublic(TTSGenerationBase):
    id: uuid.UUID
    script_id: uuid.UUID
    audio_file_path: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[float] = None
    quality_score: Optional[float] = None
    status: GenerationStatus
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

# TTS 라이브러리 (재사용 가능한 멘트)
class TTSLibraryBase(SQLModel):
    name: str = Field(max_length=200)
    text_content: str
    category: Optional[str] = Field(default=None, max_length=100)
    tags: Optional[str] = Field(default=None, max_length=500)  # 쉼표로 구분된 태그
    is_public: bool = Field(default=False)

class TTSLibraryCreate(TTSLibraryBase):
    voice_actor_id: Optional[uuid.UUID] = None

class TTSLibraryUpdate(TTSLibraryBase):
    name: Optional[str] = None
    text_content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    is_public: Optional[bool] = None

class TTSLibrary(TTSLibraryBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    voice_actor_id: Optional[uuid.UUID] = Field(foreign_key="voiceactor.id")
    audio_file_path: Optional[str] = Field(default=None, max_length=500)
    usage_count: int = Field(default=0)
    created_by: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    voice_actor: Optional["VoiceActor"] = Relationship()
    created_by_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[TTSLibrary.created_by]"}
    )

class TTSLibraryPublic(TTSLibraryBase):
    id: uuid.UUID
    voice_actor_id: Optional[uuid.UUID] = None
    audio_file_path: Optional[str] = None
    usage_count: int
    created_at: datetime
    updated_at: datetime

# 기존 Ment 모델 확장 (TTS 연동을 위해)
class MentUpdate(SQLModel):
    title: Optional[str] = None
    sub_title: Optional[str] = None
    content: Optional[str] = None
    voice_actor_id: Optional[uuid.UUID] = None  # 추가
    voice_settings: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))  # 추가
    modified_dt: datetime = Field(default_factory=datetime.now)
