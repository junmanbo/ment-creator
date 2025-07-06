import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import select, and_

from app.api.deps import CurrentUser, SessionDep
from app.models.scenario import (
    Scenario, ScenarioCreate, ScenarioUpdate, ScenarioPublic, ScenarioWithDetails,
    ScenarioNode, ScenarioNodeCreate, ScenarioNodeUpdate, ScenarioNodePublic,
    ScenarioConnection, ScenarioConnectionCreate, ScenarioConnectionUpdate, ScenarioConnectionPublic,
    ScenarioVersion, ScenarioVersionCreate, ScenarioVersionUpdate, ScenarioVersionPublic,
    ScenarioSimulation, ScenarioSimulationCreate, ScenarioSimulationPublic,
    ScenarioStatus, NodeType, VersionDiff, VersionRollbackRequest, VersionMergeRequest,
    VersionStatus, SimulationAction, SimulationResponse
)
from app.services.scenario_version_service import ScenarioVersionService
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

# === 시나리오 관리 ===

@router.post("/", response_model=ScenarioPublic)
def create_scenario(
    *,
    session: SessionDep,
    scenario_in: ScenarioCreate,
    current_user: CurrentUser
) -> Scenario:
    """새 시나리오 생성"""
    scenario = Scenario(
        **scenario_in.model_dump(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    session.add(scenario)
    session.commit()
    session.refresh(scenario)
    return scenario

@router.get("/", response_model=List[ScenarioPublic])
def get_scenarios(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
    status: Optional[ScenarioStatus] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    created_by: Optional[uuid.UUID] = None
) -> List[Scenario]:
    """시나리오 목록 조회"""
    statement = select(Scenario)
    
    # 필터 적용
    if status:
        statement = statement.where(Scenario.status == status)
    if category:
        statement = statement.where(Scenario.category == category)
    if search:
        statement = statement.where(
            Scenario.name.ilike(f"%{search}%") | 
            Scenario.description.ilike(f"%{search}%")
        )
    if created_by:
        statement = statement.where(Scenario.created_by == created_by)
    
    statement = statement.offset(skip).limit(limit).order_by(Scenario.updated_at.desc())
    scenarios = session.exec(statement).all()
    return scenarios

@router.get("/{scenario_id}", response_model=ScenarioWithDetails)
def get_scenario(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser
) -> ScenarioWithDetails:
    """특정 시나리오 상세 조회 (노드 및 연결 포함)"""
    scenario = session.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="시나리오를 찾을 수 없습니다.")
    
    # 노드들 조회
    nodes_statement = select(ScenarioNode).where(ScenarioNode.scenario_id == scenario_id)
    nodes = session.exec(nodes_statement).all()
    
    # 연결들 조회
    connections_statement = select(ScenarioConnection).where(ScenarioConnection.scenario_id == scenario_id)
    connections = session.exec(connections_statement).all()
    
    # ScenarioWithDetails 구성
    scenario_data = scenario.model_dump()
    scenario_data["nodes"] = [node.model_dump() for node in nodes]
    scenario_data["connections"] = [conn.model_dump() for conn in connections]
    
    return ScenarioWithDetails(**scenario_data)

@router.put("/{scenario_id}", response_model=ScenarioPublic)
def update_scenario(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    scenario_in: ScenarioUpdate,
    current_user: CurrentUser
) -> Scenario:
    """시나리오 정보 수정"""
    scenario = session.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="시나리오를 찾을 수 없습니다.")
    
    update_data = scenario_in.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_by"] = current_user.id
        update_data["updated_at"] = datetime.now()
        scenario.sqlmodel_update(update_data)
    
    session.add(scenario)
    session.commit()
    session.refresh(scenario)
    return scenario

@router.delete("/{scenario_id}")
def delete_scenario(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser
):
    """시나리오 삭제"""
    scenario = session.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="시나리오를 찾을 수 없습니다.")
    
    session.delete(scenario)
    session.commit()
    
    return {"message": "시나리오가 삭제되었습니다."}

# === 시나리오 노드 관리 ===

@router.post("/{scenario_id}/nodes", response_model=ScenarioNodePublic)
def create_scenario_node(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    node_in: ScenarioNodeCreate,
    current_user: CurrentUser
) -> ScenarioNode:
    """새 노드 추가"""
    # 시나리오 존재 확인
    scenario = session.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="시나리오를 찾을 수 없습니다.")
    
    # 같은 시나리오 내에서 node_id 중복 확인
    existing_node = session.exec(
        select(ScenarioNode).where(
            and_(
                ScenarioNode.scenario_id == scenario_id,
                ScenarioNode.node_id == node_in.node_id
            )
        )
    ).first()
    
    if existing_node:
        raise HTTPException(status_code=400, detail="동일한 node_id가 이미 존재합니다.")
    
    node = ScenarioNode(**node_in.model_dump())
    session.add(node)
    session.commit()
    session.refresh(node)
    return node

@router.get("/{scenario_id}/nodes", response_model=List[ScenarioNodePublic])
def get_scenario_nodes(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser
) -> List[ScenarioNode]:
    """시나리오 노드 목록 조회"""
    statement = select(ScenarioNode).where(ScenarioNode.scenario_id == scenario_id)
    nodes = session.exec(statement).all()
    return nodes

@router.put("/{scenario_id}/nodes/{node_id}", response_model=ScenarioNodePublic)
def update_scenario_node(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    node_id: str,
    node_in: ScenarioNodeUpdate,
    current_user: CurrentUser
) -> ScenarioNode:
    """노드 정보 수정"""
    node = session.exec(
        select(ScenarioNode).where(
            and_(
                ScenarioNode.scenario_id == scenario_id,
                ScenarioNode.node_id == node_id
            )
        )
    ).first()
    
    if not node:
        raise HTTPException(status_code=404, detail="노드를 찾을 수 없습니다.")
    
    update_data = node_in.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.now()
        node.sqlmodel_update(update_data)
    
    session.add(node)
    session.commit()
    session.refresh(node)
    return node

@router.delete("/{scenario_id}/nodes/{node_id}")
def delete_scenario_node(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    node_id: str,
    current_user: CurrentUser
):
    """노드 삭제"""
    node = session.exec(
        select(ScenarioNode).where(
            and_(
                ScenarioNode.scenario_id == scenario_id,
                ScenarioNode.node_id == node_id
            )
        )
    ).first()
    
    if not node:
        raise HTTPException(status_code=404, detail="노드를 찾을 수 없습니다.")
    
    # 관련 연결들도 삭제
    connections = session.exec(
        select(ScenarioConnection).where(
            and_(
                ScenarioConnection.scenario_id == scenario_id,
                (ScenarioConnection.source_node_id == node_id) |
                (ScenarioConnection.target_node_id == node_id)
            )
        )
    ).all()
    
    for connection in connections:
        session.delete(connection)
    
    session.delete(node)
    session.commit()
    
    return {"message": "노드가 삭제되었습니다."}

# === 시나리오 연결 관리 ===

@router.post("/{scenario_id}/connections", response_model=ScenarioConnectionPublic)
def create_scenario_connection(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    connection_in: ScenarioConnectionCreate,
    current_user: CurrentUser
) -> ScenarioConnection:
    """새 연결 추가"""
    # 시나리오 존재 확인
    scenario = session.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="시나리오를 찾을 수 없습니다.")
    
    # 노드들 존재 확인
    source_node = session.exec(
        select(ScenarioNode).where(
            and_(
                ScenarioNode.scenario_id == scenario_id,
                ScenarioNode.node_id == connection_in.source_node_id
            )
        )
    ).first()
    
    target_node = session.exec(
        select(ScenarioNode).where(
            and_(
                ScenarioNode.scenario_id == scenario_id,
                ScenarioNode.node_id == connection_in.target_node_id
            )
        )
    ).first()
    
    if not source_node:
        raise HTTPException(status_code=400, detail="소스 노드를 찾을 수 없습니다.")
    if not target_node:
        raise HTTPException(status_code=400, detail="대상 노드를 찾을 수 없습니다.")
    
    connection = ScenarioConnection(**connection_in.model_dump())
    session.add(connection)
    session.commit()
    session.refresh(connection)
    return connection

@router.get("/{scenario_id}/connections", response_model=List[ScenarioConnectionPublic])
def get_scenario_connections(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser
) -> List[ScenarioConnection]:
    """연결 목록 조회"""
    statement = select(ScenarioConnection).where(ScenarioConnection.scenario_id == scenario_id)
    connections = session.exec(statement).all()
    return connections

@router.delete("/{scenario_id}/connections/{connection_id}")
def delete_scenario_connection(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    connection_id: uuid.UUID,
    current_user: CurrentUser
):
    """연결 삭제"""
    connection = session.exec(
        select(ScenarioConnection).where(
            and_(
                ScenarioConnection.scenario_id == scenario_id,
                ScenarioConnection.id == connection_id
            )
        )
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="연결을 찾을 수 없습니다.")
    
    session.delete(connection)
    session.commit()
    
    return {"message": "연결이 삭제되었습니다."}

# === 시나리오 버전 관리 (강화) ===

@router.post("/{scenario_id}/versions", response_model=ScenarioVersionPublic)
def create_scenario_version(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    version_in: ScenarioVersionCreate,
    current_user: CurrentUser
) -> ScenarioVersion:
    """수동 버전 생성 (릴리즈, 태그 등)"""
    version_service = ScenarioVersionService(session)
    
    if version_in.auto_create:
        # 자동 버전 생성
        return version_service.auto_create_version(
            scenario_id, 
            current_user.id, 
            version_in.notes
        )
    else:
        # 수동 버전 생성
        return version_service.create_manual_version(
            scenario_id,
            current_user.id,
            version_in
        )

@router.post("/{scenario_id}/versions/auto", response_model=ScenarioVersionPublic)
def auto_create_version(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser,
    change_description: Optional[str] = None
) -> ScenarioVersion:
    """자동 버전 생성 (시나리오 변경 시 호출)"""
    version_service = ScenarioVersionService(session)
    return version_service.auto_create_version(
        scenario_id, 
        current_user.id, 
        change_description
    )

@router.get("/{scenario_id}/versions", response_model=List[ScenarioVersionPublic])
def get_scenario_versions(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser,
    include_auto: bool = Query(default=True, description="자동 생성 버전 포함 여부"),
    status: Optional[VersionStatus] = Query(default=None, description="버전 상태 필터")
) -> List[ScenarioVersion]:
    """버전 목록 조회 (필터 옵션 포함)"""
    version_service = ScenarioVersionService(session)
    versions = version_service.get_version_history(scenario_id, include_auto)
    
    # 상태 필터 적용
    if status:
        versions = [v for v in versions if v.version_status == status]
    
    return versions

@router.put("/{scenario_id}/versions/{version_id}", response_model=ScenarioVersionPublic)
def update_scenario_version(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    version_id: uuid.UUID,
    version_update: ScenarioVersionUpdate,
    current_user: CurrentUser
) -> ScenarioVersion:
    """버전 정보 수정 (상태, 태그, 노트 등)"""
    version = session.get(ScenarioVersion, version_id)
    if not version or version.scenario_id != scenario_id:
        raise HTTPException(status_code=404, detail="버전을 찾을 수 없습니다.")
    
    update_data = version_update.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.now()
        version.sqlmodel_update(update_data)
    
    session.add(version)
    session.commit()
    session.refresh(version)
    return version

@router.get("/{scenario_id}/versions/{version_from_id}/compare/{version_to_id}", response_model=VersionDiff)
def compare_versions(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    version_from_id: uuid.UUID,
    version_to_id: uuid.UUID,
    current_user: CurrentUser
) -> VersionDiff:
    """두 버전 간 차이점 비교"""
    version_service = ScenarioVersionService(session)
    return version_service.compare_versions(version_from_id, version_to_id)

@router.post("/{scenario_id}/versions/rollback", response_model=ScenarioVersionPublic)
def rollback_to_version(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    rollback_request: VersionRollbackRequest,
    current_user: CurrentUser
) -> ScenarioVersion:
    """특정 버전으로 롤백"""
    version_service = ScenarioVersionService(session)
    return version_service.rollback_to_version(
        scenario_id,
        rollback_request,
        current_user.id
    )

@router.get("/{scenario_id}/versions/{version_id}/preview", response_model=ScenarioWithDetails)
def preview_version(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    version_id: uuid.UUID,
    current_user: CurrentUser
) -> ScenarioWithDetails:
    """특정 버전의 시나리오 미리보기"""
    version = session.get(ScenarioVersion, version_id)
    if not version or version.scenario_id != scenario_id:
        raise HTTPException(status_code=404, detail="버전을 찾을 수 없습니다.")
    
    snapshot = version.snapshot
    scenario_data = snapshot.get('scenario', {})
    nodes_data = snapshot.get('nodes', [])
    connections_data = snapshot.get('connections', [])
    
    return ScenarioWithDetails(
        **scenario_data,
        nodes=nodes_data,
        connections=connections_data
    )

@router.get("/{scenario_id}/versions/{version_id}/changelog")
def get_version_changelog(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    version_id: uuid.UUID,
    current_user: CurrentUser
) -> Dict[str, Any]:
    """버전 변경 로그 조회"""
    version = session.get(ScenarioVersion, version_id)
    if not version or version.scenario_id != scenario_id:
        raise HTTPException(status_code=404, detail="버전을 찾을 수 없습니다.")
    
    # 이전 버전과 비교
    previous_version = session.exec(
        select(ScenarioVersion)
        .where(and_(
            ScenarioVersion.scenario_id == scenario_id,
            ScenarioVersion.created_at < version.created_at
        ))
        .order_by(ScenarioVersion.created_at.desc())
    ).first()
    
    changelog = {
        "version": version.version,
        "created_at": version.created_at,
        "notes": version.notes,
        "tag": version.tag,
        "change_summary": version.change_summary,
        "auto_generated": version.auto_generated
    }
    
    if previous_version:
        version_service = ScenarioVersionService(session)
        diff = version_service.compare_versions(previous_version.id, version.id)
        changelog["diff"] = diff.model_dump()
    
    return changelog

# === 시나리오 시뮬레이션 ===

# === 버전 브랜치 관리 (고급 기능) ===

@router.post("/{scenario_id}/versions/{parent_version_id}/branch", response_model=ScenarioVersionPublic)
def create_version_branch(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    parent_version_id: uuid.UUID,
    branch_data: ScenarioVersionCreate,
    current_user: CurrentUser
) -> ScenarioVersion:
    """부모 버전에서 브랜치 생성"""
    parent_version = session.get(ScenarioVersion, parent_version_id)
    if not parent_version or parent_version.scenario_id != scenario_id:
        raise HTTPException(status_code=404, detail="부모 버전을 찾을 수 없습니다.")
    
    # 브랜치 버전 생성
    branch_version = ScenarioVersion(
        scenario_id=scenario_id,
        version=branch_data.version,
        version_status=branch_data.version_status,
        notes=branch_data.notes or f"{parent_version.version}에서 브랜치 생성",
        tag=branch_data.tag,
        parent_version_id=parent_version_id,
        snapshot=parent_version.snapshot,  # 부모 스냅샷으로 시작
        auto_generated=False,
        created_by=current_user.id
    )
    
    session.add(branch_version)
    session.commit()
    session.refresh(branch_version)
    
    return branch_version

@router.get("/{scenario_id}/versions/tree")
def get_version_tree(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser
) -> Dict[str, Any]:
    """버전 트리 구조 조회 (브랜치 포함)"""
    versions = session.exec(
        select(ScenarioVersion)
        .where(ScenarioVersion.scenario_id == scenario_id)
        .order_by(ScenarioVersion.created_at)
    ).all()
    
    # 트리 구조 생성
    version_map = {str(v.id): v for v in versions}
    tree = {"nodes": [], "edges": []}
    
    for version in versions:
        tree["nodes"].append({
            "id": str(version.id),
            "version": version.version,
            "status": version.version_status,
            "tag": version.tag,
            "created_at": version.created_at.isoformat(),
            "auto_generated": version.auto_generated
        })
        
        if version.parent_version_id:
            tree["edges"].append({
                "from": str(version.parent_version_id),
                "to": str(version.id)
            })
    
    return tree

# === 시나리오 시뮤레이션 ===

@router.post("/{scenario_id}/simulate", response_model=ScenarioSimulationPublic)
def start_scenario_simulation(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    simulation_in: ScenarioSimulationCreate,
    current_user: CurrentUser
) -> ScenarioSimulation:
    """시나리오 시뮬레이션 시작"""
    # 시나리오 존재 확인
    scenario = session.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="시나리오를 찾을 수 없습니다.")
    
    # 시작 노드 존재 확인
    start_node = session.exec(
        select(ScenarioNode).where(
            and_(
                ScenarioNode.scenario_id == scenario_id,
                ScenarioNode.node_id == simulation_in.start_node_id
            )
        )
    ).first()
    
    if not start_node:
        raise HTTPException(status_code=400, detail="시작 노드를 찾을 수 없습니다.")
    
    simulation_data = simulation_in.model_dump()
    simulation_data["current_node_id"] = simulation_in.start_node_id
    simulation_data["session_data"] = {}
    simulation_data["started_by"] = current_user.id
    
    simulation = ScenarioSimulation(**simulation_data)
    session.add(simulation)
    session.commit()
    session.refresh(simulation)
    return simulation

@router.get("/simulations/{simulation_id}", response_model=ScenarioSimulationPublic)
def get_simulation_status(
    *,
    session: SessionDep,
    simulation_id: uuid.UUID,
    current_user: CurrentUser
) -> ScenarioSimulation:
    """시뮬레이션 상태 조회"""
    simulation = session.get(ScenarioSimulation, simulation_id)
    if not simulation:
        raise HTTPException(status_code=404, detail="시뮬레이션을 찾을 수 없습니다.")
    
    if simulation.started_by != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    
    return simulation

@router.delete("/simulations/{simulation_id}")
def stop_simulation(
    *,
    session: SessionDep,
    simulation_id: uuid.UUID,
    current_user: CurrentUser
):
    """시뮬레이션 종료"""
    simulation = session.get(ScenarioSimulation, simulation_id)
    if not simulation:
        raise HTTPException(status_code=404, detail="시뮬레이션을 찾을 수 없습니다.")
    
    if simulation.started_by != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    
    simulation.status = "completed"
    simulation.completed_at = datetime.now()
    
    session.add(simulation)
    session.commit()
    
    return {"message": "시뮬레이션이 종료되었습니다."}

# === 새로운 시뮬레이션 API ===

@router.post("/{scenario_id}/simulation/start", response_model=SimulationResponse)
def start_simulation(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser
) -> SimulationResponse:
    """시나리오 시뮬레이션 시작"""
    try:
        simulation_service = SimulationService(session)
        return simulation_service.start_simulation(scenario_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulation/{simulation_id}/action", response_model=SimulationResponse)
def execute_simulation_action(
    *,
    session: SessionDep,
    simulation_id: uuid.UUID,
    action: SimulationAction,
    current_user: CurrentUser
) -> SimulationResponse:
    """시뮬레이션 액션 실행"""
    try:
        simulation_service = SimulationService(session)
        
        # 시뮬레이션 소유권 확인
        simulation = session.get(ScenarioSimulation, simulation_id)
        if not simulation:
            raise HTTPException(status_code=404, detail="시뮬레이션을 찾을 수 없습니다.")
        
        if simulation.started_by != current_user.id:
            raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
        
        return simulation_service.execute_action(simulation_id, action)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/simulation/{simulation_id}", response_model=SimulationResponse)
def get_simulation_state(
    *,
    session: SessionDep,
    simulation_id: uuid.UUID,
    current_user: CurrentUser
) -> SimulationResponse:
    """시뮬레이션 상태 조회"""
    try:
        simulation_service = SimulationService(session)
        
        # 시뮬레이션 소유권 확인
        simulation = session.get(ScenarioSimulation, simulation_id)
        if not simulation:
            raise HTTPException(status_code=404, detail="시뮬레이션을 찾을 수 없습니다.")
        
        if simulation.started_by != current_user.id:
            raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
        
        return simulation_service.get_simulation(simulation_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{scenario_id}/simulation/audio/{node_id}")
def get_node_audio(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    node_id: str,
    current_user: CurrentUser
):
    """노드의 TTS 오디오 파일 반환"""
    # ScenarioTTS에서 활성화된 TTS 조회
    from app.models.scenario_tts import ScenarioTTS
    
    scenario_tts = session.exec(
        select(ScenarioTTS).where(
            and_(
                ScenarioTTS.scenario_id == scenario_id,
                ScenarioTTS.node_id == node_id,
                ScenarioTTS.is_active == True
            )
        )
    ).first()
    
    if not scenario_tts:
        # 디버깅을 위해 노드 존재 여부 확인
        node_exists = session.exec(
            select(ScenarioNode).where(
                ScenarioNode.scenario_id == scenario_id,
                ScenarioNode.node_id == node_id
            )
        ).first()
        
        if not node_exists:
            raise HTTPException(status_code=404, detail=f"노드 '{node_id}'를 찾을 수 없습니다.")
        else:
            raise HTTPException(status_code=404, detail=f"노드 '{node_id}'의 TTS가 생성되지 않았습니다. 먼저 TTS를 생성해주세요.")
    
    if not scenario_tts.tts_generation_id:
        raise HTTPException(status_code=404, detail="TTS 생성이 진행 중이거나 실패했습니다. 잠시 후 다시 시도해주세요.")
    
    # TTS 스트리밍 엔드포인트 URL 반환 (상대 경로로)
    audio_url = f"/voice-actors/tts-generations/{scenario_tts.tts_generation_id}/audio"
    
    return {"audio_url": audio_url}
