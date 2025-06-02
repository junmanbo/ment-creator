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
    ScenarioVersion, ScenarioVersionCreate, ScenarioVersionPublic,
    ScenarioSimulation, ScenarioSimulationCreate, ScenarioSimulationPublic,
    ScenarioStatus, NodeType
)

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

# === 시나리오 버전 관리 ===

@router.post("/{scenario_id}/versions", response_model=ScenarioVersionPublic)
def create_scenario_version(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    version_in: ScenarioVersionCreate,
    current_user: CurrentUser
) -> ScenarioVersion:
    """새 버전 생성"""
    # 시나리오 존재 확인
    scenario = session.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="시나리오를 찾을 수 없습니다.")
    
    # 현재 시나리오 상태를 스냅샷으로 저장
    nodes = session.exec(select(ScenarioNode).where(ScenarioNode.scenario_id == scenario_id)).all()
    connections = session.exec(select(ScenarioConnection).where(ScenarioConnection.scenario_id == scenario_id)).all()
    
    snapshot = {
        "scenario": scenario.model_dump(),
        "nodes": [node.model_dump() for node in nodes],
        "connections": [conn.model_dump() for conn in connections]
    }
    
    version_data = version_in.model_dump()
    version_data["snapshot"] = snapshot
    version_data["created_by"] = current_user.id
    
    version = ScenarioVersion(**version_data)
    session.add(version)
    session.commit()
    session.refresh(version)
    return version

@router.get("/{scenario_id}/versions", response_model=List[ScenarioVersionPublic])
def get_scenario_versions(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser
) -> List[ScenarioVersion]:
    """버전 목록 조회"""
    statement = select(ScenarioVersion).where(
        ScenarioVersion.scenario_id == scenario_id
    ).order_by(ScenarioVersion.created_at.desc())
    versions = session.exec(statement).all()
    return versions

# === 시나리오 시뮬레이션 ===

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
