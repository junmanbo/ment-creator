# backend/app/api/routes/scenario_tts.py
import uuid
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlmodel import select, and_

from app.api.deps import CurrentUser, SessionDep
from app.models.scenario_tts import (
    ScenarioTTS, ScenarioTTSCreate, ScenarioTTSUpdate, ScenarioTTSPublic, ScenarioTTSStatus
)
from app.models.scenario import Scenario, ScenarioNode
from app.models.tts import TTSGeneration, TTSScript, TTSScriptCreate, TTSGenerateRequest
from app.services.tts_service import tts_service

router = APIRouter(prefix="/scenario-tts", tags=["scenario-tts"])

@router.post("/", response_model=ScenarioTTSPublic)
def create_scenario_tts(
    *,
    session: SessionDep,
    scenario_tts_in: ScenarioTTSCreate,
    current_user: CurrentUser
) -> ScenarioTTS:
    """시나리오 노드용 TTS 생성"""
    # 시나리오와 노드 존재 확인
    scenario = session.get(Scenario, scenario_tts_in.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="시나리오를 찾을 수 없습니다.")
    
    node = session.exec(
        select(ScenarioNode).where(
            and_(
                ScenarioNode.scenario_id == scenario_tts_in.scenario_id,
                ScenarioNode.node_id == scenario_tts_in.node_id
            )
        )
    ).first()
    
    if not node:
        raise HTTPException(status_code=404, detail="노드를 찾을 수 없습니다.")
    
    # 기존 TTS 비활성화
    existing_tts = session.exec(
        select(ScenarioTTS).where(
            and_(
                ScenarioTTS.scenario_id == scenario_tts_in.scenario_id,
                ScenarioTTS.node_id == scenario_tts_in.node_id,
                ScenarioTTS.is_active == True
            )
        )
    ).all()
    
    for tts in existing_tts:
        tts.is_active = False
        session.add(tts)
    
    # 새 TTS 생성
    scenario_tts = ScenarioTTS(
        **scenario_tts_in.model_dump(),
        created_by=current_user.id
    )
    session.add(scenario_tts)
    session.commit()
    session.refresh(scenario_tts)
    return scenario_tts

@router.get("/scenario/{scenario_id}", response_model=List[ScenarioTTSPublic])
def get_scenario_tts_list(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser,
    active_only: bool = True
) -> List[ScenarioTTS]:
    """시나리오의 모든 TTS 조회"""
    statement = select(ScenarioTTS).where(ScenarioTTS.scenario_id == scenario_id)
    
    if active_only:
        statement = statement.where(ScenarioTTS.is_active == True)
    
    tts_list = session.exec(statement).all()
    return tts_list

@router.get("/scenario/{scenario_id}/node/{node_id}", response_model=ScenarioTTSPublic)
def get_node_tts(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    node_id: str,
    current_user: CurrentUser
) -> ScenarioTTS:
    """특정 노드의 활성 TTS 조회"""
    tts = session.exec(
        select(ScenarioTTS).where(
            and_(
                ScenarioTTS.scenario_id == scenario_id,
                ScenarioTTS.node_id == node_id,
                ScenarioTTS.is_active == True
            )
        )
    ).first()
    
    if not tts:
        raise HTTPException(status_code=404, detail="해당 노드의 TTS를 찾을 수 없습니다.")
    
    return tts

@router.post("/scenario/{scenario_id}/node/{node_id}/generate")
async def generate_node_tts(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    node_id: str,
    tts_data: ScenarioTTSCreate,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks
):
    """노드용 TTS 생성 및 연결"""
    # 1. ScenarioTTS 생성
    scenario_tts = ScenarioTTS(
        scenario_id=scenario_id,
        node_id=node_id,
        text_content=tts_data.text_content,
        voice_actor_id=tts_data.voice_actor_id,
        voice_settings=tts_data.voice_settings,
        created_by=current_user.id
    )
    session.add(scenario_tts)
    session.commit()
    session.refresh(scenario_tts)
    
    # 2. TTS 스크립트 생성
    script = TTSScript(
        text_content=tts_data.text_content,
        voice_actor_id=tts_data.voice_actor_id,
        voice_settings=tts_data.voice_settings,
        created_by=current_user.id
    )
    session.add(script)
    session.commit()
    session.refresh(script)
    
    # 3. TTS 생성 요청
    generation = TTSGeneration(
        script_id=script.id,
        voice_model_id=None,  # voice_actor로부터 자동 선택
        requested_by=current_user.id
    )
    session.add(generation)
    session.commit()
    session.refresh(generation)
    
    # 4. ScenarioTTS에 generation_id 연결
    scenario_tts.tts_generation_id = generation.id
    session.add(scenario_tts)
    session.commit()
    
    # 5. 백그라운드에서 TTS 생성 처리
    background_tasks.add_task(
        tts_service.process_scenario_tts_generation,
        generation.id,
        scenario_tts.id
    )
    
    return {
        "scenario_tts_id": scenario_tts.id,
        "generation_id": generation.id,
        "status": "processing"
    }

@router.get("/scenario/{scenario_id}/status", response_model=ScenarioTTSStatus)
def get_scenario_tts_status(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser
) -> ScenarioTTSStatus:
    """시나리오 TTS 전체 현황 조회"""
    # 전체 노드 수
    total_nodes = session.exec(
        select(ScenarioNode).where(ScenarioNode.scenario_id == scenario_id)
    ).all()
    
    # TTS가 있는 노드 수 (message 타입만)
    message_nodes = [node for node in total_nodes if node.node_type == "message"]
    total_message_nodes = len(message_nodes)
    
    # TTS 준비된 노드 수
    tts_ready = session.exec(
        select(ScenarioTTS).where(
            and_(
                ScenarioTTS.scenario_id == scenario_id,
                ScenarioTTS.is_active == True,
                ScenarioTTS.audio_file_path.isnot(None)
            )
        )
    ).all()
    
    tts_ready_count = len(tts_ready)
    
    # TTS 대기 중인 노드 수
    tts_pending = session.exec(
        select(ScenarioTTS).where(
            and_(
                ScenarioTTS.scenario_id == scenario_id,
                ScenarioTTS.is_active == True,
                ScenarioTTS.audio_file_path.is_(None)
            )
        )
    ).all()
    
    tts_pending_count = len(tts_pending)
    
    # 완성률 계산
    completion_percentage = (tts_ready_count / total_message_nodes * 100) if total_message_nodes > 0 else 0
    
    return ScenarioTTSStatus(
        scenario_id=scenario_id,
        total_nodes=total_message_nodes,
        tts_ready_nodes=tts_ready_count,
        tts_pending_nodes=tts_pending_count,
        completion_percentage=completion_percentage,
        last_updated=datetime.now()
    )

@router.delete("/{scenario_tts_id}")
def delete_scenario_tts(
    *,
    session: SessionDep,
    scenario_tts_id: uuid.UUID,
    current_user: CurrentUser
):
    """시나리오 TTS 삭제"""
    scenario_tts = session.get(ScenarioTTS, scenario_tts_id)
    if not scenario_tts:
        raise HTTPException(status_code=404, detail="TTS를 찾을 수 없습니다.")
    
    session.delete(scenario_tts)
    session.commit()
    
    return {"message": "TTS가 삭제되었습니다."}

@router.put("/{scenario_tts_id}/activate")
def activate_scenario_tts(
    *,
    session: SessionDep,
    scenario_tts_id: uuid.UUID,
    current_user: CurrentUser
):
    """특정 TTS를 활성화 (같은 노드의 다른 TTS는 비활성화)"""
    scenario_tts = session.get(ScenarioTTS, scenario_tts_id)
    if not scenario_tts:
        raise HTTPException(status_code=404, detail="TTS를 찾을 수 없습니다.")
    
    # 같은 노드의 다른 TTS 비활성화
    existing_tts = session.exec(
        select(ScenarioTTS).where(
            and_(
                ScenarioTTS.scenario_id == scenario_tts.scenario_id,
                ScenarioTTS.node_id == scenario_tts.node_id,
                ScenarioTTS.id != scenario_tts_id
            )
        )
    ).all()
    
    for tts in existing_tts:
        tts.is_active = False
        session.add(tts)
    
    # 선택된 TTS 활성화
    scenario_tts.is_active = True
    session.add(scenario_tts)
    session.commit()
    
    return {"message": "TTS가 활성화되었습니다."}
