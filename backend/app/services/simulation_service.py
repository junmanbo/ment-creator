import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime

from sqlmodel import Session, select
from app.models.scenario import (
    Scenario, ScenarioNode, ScenarioConnection, ScenarioSimulation,
    SimulationAction, SimulationResponse, SimulationNodeInfo
)

class SimulationService:
    def __init__(self, session: Session):
        self.session = session

    def start_simulation(self, scenario_id: uuid.UUID, user_id: uuid.UUID) -> SimulationResponse:
        """시뮬레이션 시작"""
        # 시나리오 및 노드 로드
        scenario = self.session.get(Scenario, scenario_id)
        if not scenario:
            raise ValueError("시나리오를 찾을 수 없습니다")

        # 시작 노드 찾기
        start_node = self.session.exec(
            select(ScenarioNode).where(
                ScenarioNode.scenario_id == scenario_id,
                ScenarioNode.node_type == "start"
            )
        ).first()

        if not start_node:
            raise ValueError("시작 노드를 찾을 수 없습니다")

        # 기존 실행 중인 시뮬레이션 종료
        existing_simulations = self.session.exec(
            select(ScenarioSimulation).where(
                ScenarioSimulation.scenario_id == scenario_id,
                ScenarioSimulation.started_by == user_id,
                ScenarioSimulation.status == "running"
            )
        ).all()

        for sim in existing_simulations:
            sim.status = "stopped"
            sim.completed_at = datetime.now()

        # 새 시뮬레이션 생성
        simulation = ScenarioSimulation(
            scenario_id=scenario_id,
            start_node_id=start_node.node_id,
            current_node_id=start_node.node_id,
            session_data={},
            status="running",
            started_by=user_id
        )

        self.session.add(simulation)
        self.session.commit()
        self.session.refresh(simulation)

        return self._get_simulation_state(simulation.id)

    def execute_action(self, simulation_id: uuid.UUID, action: SimulationAction) -> SimulationResponse:
        """시뮬레이션 액션 실행"""
        simulation = self.session.get(ScenarioSimulation, simulation_id)
        if not simulation:
            raise ValueError("시뮬레이션을 찾을 수 없습니다")

        if simulation.status != "running":
            raise ValueError("시뮬레이션이 실행 중이 아닙니다")

        if action.action_type == "next":
            return self._move_to_next_node(simulation)
        elif action.action_type == "input":
            return self._handle_input(simulation, action.input_value)
        elif action.action_type == "condition_select":
            return self._handle_condition_select(simulation, action.condition_choice)
        elif action.action_type == "restart":
            return self._restart_simulation(simulation)
        elif action.action_type == "stop":
            return self._stop_simulation(simulation)
        else:
            raise ValueError(f"알 수 없는 액션 타입: {action.action_type}")

    def _move_to_next_node(self, simulation: ScenarioSimulation) -> SimulationResponse:
        """다음 노드로 이동"""
        current_node = self._get_node_by_id(simulation.scenario_id, simulation.current_node_id)
        if not current_node:
            raise ValueError("현재 노드를 찾을 수 없습니다")

        # 다음 노드 찾기
        next_connection = self.session.exec(
            select(ScenarioConnection).where(
                ScenarioConnection.scenario_id == simulation.scenario_id,
                ScenarioConnection.source_node_id == current_node.node_id
            )
        ).first()

        if next_connection:
            simulation.current_node_id = next_connection.target_node_id
            self.session.commit()

        return self._get_simulation_state(simulation.id)

    def _handle_input(self, simulation: ScenarioSimulation, input_value: Optional[str]) -> SimulationResponse:
        """입력 노드 처리"""
        if not input_value:
            raise ValueError("입력 값이 필요합니다")

        # 세션 데이터에 입력 값 저장
        session_data = simulation.session_data or {}
        session_data[f"input_{simulation.current_node_id}"] = input_value
        simulation.session_data = session_data

        # 다음 노드로 이동
        return self._move_to_next_node(simulation)

    def _handle_condition_select(self, simulation: ScenarioSimulation, choice: Optional[str]) -> SimulationResponse:
        """조건 노드 처리"""
        if choice not in ["yes", "no"]:
            raise ValueError("조건 선택은 'yes' 또는 'no'여야 합니다")

        # 조건에 따른 연결 찾기
        connection = self.session.exec(
            select(ScenarioConnection).where(
                ScenarioConnection.scenario_id == simulation.scenario_id,
                ScenarioConnection.source_node_id == simulation.current_node_id
            )
        ).all()

        # yes/no에 따른 연결 선택
        target_connection = None
        for conn in connection:
            # source_handle 기반으로 연결 선택
            if conn.source_handle == choice:
                target_connection = conn
                break

        if not target_connection and connection:
            # 기본적으로 첫 번째 연결 사용
            target_connection = connection[0]

        if target_connection:
            simulation.current_node_id = target_connection.target_node_id
            self.session.commit()

        return self._get_simulation_state(simulation.id)

    def _restart_simulation(self, simulation: ScenarioSimulation) -> SimulationResponse:
        """시뮬레이션 재시작"""
        simulation.current_node_id = simulation.start_node_id
        simulation.session_data = {}
        simulation.status = "running"
        self.session.commit()

        return self._get_simulation_state(simulation.id)

    def _stop_simulation(self, simulation: ScenarioSimulation) -> SimulationResponse:
        """시뮬레이션 중지"""
        simulation.status = "stopped"
        simulation.completed_at = datetime.now()
        self.session.commit()

        return self._get_simulation_state(simulation.id)

    def _get_simulation_state(self, simulation_id: uuid.UUID) -> SimulationResponse:
        """현재 시뮬레이션 상태 반환"""
        simulation = self.session.get(ScenarioSimulation, simulation_id)
        if not simulation:
            raise ValueError("시뮬레이션을 찾을 수 없습니다")

        current_node = None
        available_actions = []
        is_completed = False

        if simulation.current_node_id and simulation.status == "running":
            current_node = self._get_node_by_id(simulation.scenario_id, simulation.current_node_id)
            
            if current_node:
                # 노드 타입에 따른 사용 가능한 액션 결정
                if current_node.node_type == "start":
                    available_actions = ["next"]
                elif current_node.node_type == "message":
                    available_actions = ["next"]
                elif current_node.node_type == "input":
                    available_actions = ["input"]
                elif current_node.node_type == "condition":
                    available_actions = ["condition_select"]
                elif current_node.node_type == "branch":
                    available_actions = ["next"]
                elif current_node.node_type == "transfer":
                    available_actions = ["next"]
                elif current_node.node_type == "end":
                    available_actions = []
                    is_completed = True
                    simulation.status = "completed"
                    simulation.completed_at = datetime.now()
                    self.session.commit()

        # 항상 사용 가능한 액션들
        if simulation.status == "running":
            available_actions.extend(["restart", "stop"])

        node_data = None
        if current_node:
            node_data = {
                "node_id": current_node.node_id,
                "node_type": current_node.node_type,
                "name": current_node.name,
                "config": current_node.config
            }

        return SimulationResponse(
            simulation_id=simulation.id,
            current_node_id=simulation.current_node_id,
            node_data=node_data,
            available_actions=available_actions,
            status=simulation.status,
            session_data=simulation.session_data,
            is_completed=is_completed
        )

    def _get_node_by_id(self, scenario_id: uuid.UUID, node_id: str) -> Optional[ScenarioNode]:
        """노드 ID로 노드 조회"""
        return self.session.exec(
            select(ScenarioNode).where(
                ScenarioNode.scenario_id == scenario_id,
                ScenarioNode.node_id == node_id
            )
        ).first()

    def get_simulation(self, simulation_id: uuid.UUID) -> SimulationResponse:
        """시뮬레이션 상태 조회"""
        return self._get_simulation_state(simulation_id)

    def get_user_simulations(self, user_id: uuid.UUID, scenario_id: Optional[uuid.UUID] = None) -> List[ScenarioSimulation]:
        """사용자의 시뮬레이션 목록 조회"""
        query = select(ScenarioSimulation).where(ScenarioSimulation.started_by == user_id)
        
        if scenario_id:
            query = query.where(ScenarioSimulation.scenario_id == scenario_id)
            
        return self.session.exec(query.order_by(ScenarioSimulation.started_at.desc())).all()