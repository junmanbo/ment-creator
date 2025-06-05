# backend/app/models/scenario_tts.py
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy import JSON

# 시나리오와 TTS 연결 모델
class ScenarioTTSBase(SQLModel):
    text_content: str
    voice_settings: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))  # 속도, 톤, 감정 설정

class ScenarioTTSCreate(ScenarioTTSBase):
    scenario_id: uuid.UUID
    node_id: str
    voice_actor_id: Optional[uuid.UUID] = None

class ScenarioTTSUpdate(ScenarioTTSBase):
    text_content: Optional[str] = None
    voice_actor_id: Optional[uuid.UUID] = None
    voice_settings: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

class ScenarioTTS(ScenarioTTSBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    scenario_id: uuid.UUID = Field(foreign_key="scenario.id")
    node_id: str = Field(max_length=50)  # 시나리오 노드 ID 참조
    voice_actor_id: Optional[uuid.UUID] = Field(foreign_key="voiceactor.id")
    tts_generation_id: Optional[uuid.UUID] = Field(foreign_key="ttsgeneration.id")
    audio_file_path: Optional[str] = Field(default=None, max_length=500)
    is_active: bool = Field(default=True)  # 현재 사용 중인 TTS인지
    created_by: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    scenario: Optional["Scenario"] = Relationship()
    voice_actor: Optional["VoiceActor"] = Relationship()
    tts_generation: Optional["TTSGeneration"] = Relationship()
    created_by_user: Optional["User"] = Relationship()

class ScenarioTTSPublic(ScenarioTTSBase):
    id: uuid.UUID
    scenario_id: uuid.UUID
    node_id: str
    voice_actor_id: Optional[uuid.UUID] = None
    tts_generation_id: Optional[uuid.UUID] = None
    audio_file_path: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

# 시나리오 전체 TTS 현황
class ScenarioTTSStatus(SQLModel):
    scenario_id: uuid.UUID
    total_nodes: int
    tts_ready_nodes: int
    tts_pending_nodes: int
    completion_percentage: float
    last_updated: datetime
