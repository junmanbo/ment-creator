"""
시나리오 버전 관리 강화 서비스

이 서비스는 다음 기능들을 제공합니다:
- 자동 버전 생성
- 버전 간 비교 및 차이점 분석
- 특정 버전으로 롤백
- 버전 병합
- 버전 태그 관리
"""

import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from sqlmodel import Session, select, and_
from difflib import unified_diff

from app.models.scenario import (
    Scenario, ScenarioNode, ScenarioConnection, ScenarioVersion,
    ScenarioVersionCreate, VersionDiff, VersionRollbackRequest, VersionMergeRequest,
    VersionStatus, ChangeType
)
from app.models.users import User


class ScenarioVersionService:
    """시나리오 버전 관리 강화 서비스"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def auto_create_version(
        self, 
        scenario_id: uuid.UUID, 
        user_id: uuid.UUID,
        change_description: Optional[str] = None
    ) -> ScenarioVersion:
        """
        시나리오 변경 시 자동으로 버전 생성
        
        Args:
            scenario_id: 시나리오 ID
            user_id: 사용자 ID
            change_description: 변경 설명
            
        Returns:
            생성된 버전
        """
        scenario = self.session.get(Scenario, scenario_id)
        if not scenario:
            raise ValueError("시나리오를 찾을 수 없습니다.")
        
        # 현재 최신 버전 조회
        latest_version = self.session.exec(
            select(ScenarioVersion)
            .where(ScenarioVersion.scenario_id == scenario_id)
            .order_by(ScenarioVersion.created_at.desc())
        ).first()
        
        # 새 버전 번호 생성
        if latest_version:
            # 기존 버전이 있으면 마이너 버전 증가
            version_parts = latest_version.version.split('.')
            if len(version_parts) >= 2:
                major, minor = int(version_parts[0]), int(version_parts[1])
                new_version = f"{major}.{minor + 1}"
            else:
                new_version = f"{latest_version.version}.1"
        else:
            new_version = "1.0"
        
        # 현재 시나리오 스냅샷 생성
        snapshot = self._create_scenario_snapshot(scenario_id)
        
        # 변경 요약 생성 (이전 버전과 비교)
        change_summary = None
        if latest_version:
            change_summary = self._generate_change_summary(
                latest_version.snapshot, 
                snapshot
            )
        
        # 자동 버전 생성
        version = ScenarioVersion(
            scenario_id=scenario_id,
            version=new_version,
            version_status=VersionStatus.DRAFT,
            notes=change_description or "자동 생성된 버전",
            snapshot=snapshot,
            change_summary=change_summary,
            auto_generated=True,
            created_by=user_id
        )
        
        self.session.add(version)
        self.session.commit()
        self.session.refresh(version)
        
        return version
    
    def create_manual_version(
        self,
        scenario_id: uuid.UUID,
        user_id: uuid.UUID,
        version_data: ScenarioVersionCreate
    ) -> ScenarioVersion:
        """
        수동으로 버전 생성 (릴리즈, 태그 등)
        
        Args:
            scenario_id: 시나리오 ID
            user_id: 사용자 ID
            version_data: 버전 데이터
            
        Returns:
            생성된 버전
        """
        # 버전 중복 확인
        existing_version = self.session.exec(
            select(ScenarioVersion)
            .where(and_(
                ScenarioVersion.scenario_id == scenario_id,
                ScenarioVersion.version == version_data.version
            ))
        ).first()
        
        if existing_version:
            raise ValueError(f"버전 {version_data.version}이 이미 존재합니다.")
        
        # 스냅샷 생성
        snapshot = self._create_scenario_snapshot(scenario_id)
        
        # 이전 버전과 변경 요약 생성
        change_summary = None
        latest_version = self.session.exec(
            select(ScenarioVersion)
            .where(ScenarioVersion.scenario_id == scenario_id)
            .order_by(ScenarioVersion.created_at.desc())
        ).first()
        
        if latest_version:
            change_summary = self._generate_change_summary(
                latest_version.snapshot,
                snapshot
            )
        
        version = ScenarioVersion(
            **version_data.model_dump(exclude={"scenario_id", "auto_create"}),
            scenario_id=scenario_id,
            snapshot=snapshot,
            change_summary=change_summary,
            auto_generated=False,
            created_by=user_id
        )
        
        self.session.add(version)
        self.session.commit()
        self.session.refresh(version)
        
        return version
    
    def compare_versions(
        self,
        version_from_id: uuid.UUID,
        version_to_id: uuid.UUID
    ) -> VersionDiff:
        """
        두 버전 간 차이점 비교
        
        Args:
            version_from_id: 비교 시작 버전 ID
            version_to_id: 비교 대상 버전 ID
            
        Returns:
            버전 차이점 정보
        """
        version_from = self.session.get(ScenarioVersion, version_from_id)
        version_to = self.session.get(ScenarioVersion, version_to_id)
        
        if not version_from or not version_to:
            raise ValueError("비교할 버전을 찾을 수 없습니다.")
        
        snapshot_from = version_from.snapshot
        snapshot_to = version_to.snapshot
        
        # 노드 변경 사항 분석
        nodes_from = {node['node_id']: node for node in snapshot_from.get('nodes', [])}
        nodes_to = {node['node_id']: node for node in snapshot_to.get('nodes', [])}
        
        nodes_added = []
        nodes_modified = []
        nodes_deleted = []
        
        # 추가된 노드
        for node_id in nodes_to:
            if node_id not in nodes_from:
                nodes_added.append(node_id)
        
        # 삭제된 노드
        for node_id in nodes_from:
            if node_id not in nodes_to:
                nodes_deleted.append(node_id)
        
        # 수정된 노드
        for node_id in nodes_to:
            if node_id in nodes_from:
                if nodes_from[node_id] != nodes_to[node_id]:
                    nodes_modified.append(node_id)
        
        # 연결 변경 사항 분석
        connections_from = {
            f"{conn['source_node_id']}-{conn['target_node_id']}": conn 
            for conn in snapshot_from.get('connections', [])
        }
        connections_to = {
            f"{conn['source_node_id']}-{conn['target_node_id']}": conn 
            for conn in snapshot_to.get('connections', [])
        }
        
        connections_added = []
        connections_modified = []
        connections_deleted = []
        
        # 추가된 연결
        for conn_key in connections_to:
            if conn_key not in connections_from:
                connections_added.append(conn_key)
        
        # 삭제된 연결
        for conn_key in connections_from:
            if conn_key not in connections_to:
                connections_deleted.append(conn_key)
        
        # 수정된 연결
        for conn_key in connections_to:
            if conn_key in connections_from:
                if connections_from[conn_key] != connections_to[conn_key]:
                    connections_modified.append(conn_key)
        
        # 상세 변경 사항 생성
        changes = []
        
        # 노드 변경 사항
        for node_id in nodes_added:
            changes.append({
                "type": ChangeType.ADDED,
                "object_type": "node",
                "object_id": node_id,
                "description": f"노드 '{nodes_to[node_id]['name']}' 추가"
            })
        
        for node_id in nodes_deleted:
            changes.append({
                "type": ChangeType.DELETED,
                "object_type": "node",
                "object_id": node_id,
                "description": f"노드 '{nodes_from[node_id]['name']}' 삭제"
            })
        
        for node_id in nodes_modified:
            node_changes = self._analyze_node_changes(
                nodes_from[node_id], 
                nodes_to[node_id]
            )
            changes.append({
                "type": ChangeType.MODIFIED,
                "object_type": "node",
                "object_id": node_id,
                "description": f"노드 '{nodes_to[node_id]['name']}' 수정",
                "details": node_changes
            })
        
        # 연결 변경 사항
        for conn_key in connections_added:
            changes.append({
                "type": ChangeType.ADDED,
                "object_type": "connection",
                "object_id": conn_key,
                "description": f"연결 '{conn_key}' 추가"
            })
        
        for conn_key in connections_deleted:
            changes.append({
                "type": ChangeType.DELETED,
                "object_type": "connection",
                "object_id": conn_key,
                "description": f"연결 '{conn_key}' 삭제"
            })
        
        # 변경 통계
        summary = {
            "total_changes": len(changes),
            "nodes_added": len(nodes_added),
            "nodes_modified": len(nodes_modified),
            "nodes_deleted": len(nodes_deleted),
            "connections_added": len(connections_added),
            "connections_modified": len(connections_modified),
            "connections_deleted": len(connections_deleted)
        }
        
        return VersionDiff(
            version_from=version_from.version,
            version_to=version_to.version,
            changes=changes,
            nodes_added=nodes_added,
            nodes_modified=nodes_modified,
            nodes_deleted=nodes_deleted,
            connections_added=connections_added,
            connections_modified=connections_modified,
            connections_deleted=connections_deleted,
            summary=summary
        )
    
    def rollback_to_version(
        self,
        scenario_id: uuid.UUID,
        rollback_request: VersionRollbackRequest,
        user_id: uuid.UUID
    ) -> ScenarioVersion:
        """
        특정 버전으로 롤백
        
        Args:
            scenario_id: 시나리오 ID
            rollback_request: 롤백 요청 정보
            user_id: 롤백 실행자 ID
            
        Returns:
            롤백 후 생성된 새 버전
        """
        target_version = self.session.get(ScenarioVersion, rollback_request.target_version_id)
        if not target_version or target_version.scenario_id != scenario_id:
            raise ValueError("롤백 대상 버전을 찾을 수 없습니다.")
        
        scenario = self.session.get(Scenario, scenario_id)
        if not scenario:
            raise ValueError("시나리오를 찾을 수 없습니다.")
        
        # 백업 버전 생성 (옵션)
        backup_version = None
        if rollback_request.create_backup:
            backup_version = self.auto_create_version(
                scenario_id, 
                user_id, 
                f"롤백 전 백업 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            )
        
        # 대상 버전의 스냅샷으로 현재 시나리오 복원
        target_snapshot = target_version.snapshot
        
        # 기존 노드와 연결 삭제
        existing_nodes = self.session.exec(
            select(ScenarioNode).where(ScenarioNode.scenario_id == scenario_id)
        ).all()
        for node in existing_nodes:
            self.session.delete(node)
        
        existing_connections = self.session.exec(
            select(ScenarioConnection).where(ScenarioConnection.scenario_id == scenario_id)
        ).all()
        for connection in existing_connections:
            self.session.delete(connection)
        
        # 대상 버전의 노드와 연결 복원
        for node_data in target_snapshot.get('nodes', []):
            node = ScenarioNode(
                scenario_id=scenario_id,
                **{k: v for k, v in node_data.items() if k not in ['id', 'scenario_id', 'created_at', 'updated_at']}
            )
            self.session.add(node)
        
        for conn_data in target_snapshot.get('connections', []):
            connection = ScenarioConnection(
                scenario_id=scenario_id,
                **{k: v for k, v in conn_data.items() if k not in ['id', 'scenario_id', 'created_at']}
            )
            self.session.add(connection)
        
        # 시나리오 메타데이터 업데이트
        scenario_data = target_snapshot.get('scenario', {})
        if scenario_data:
            scenario.updated_by = user_id
            scenario.updated_at = datetime.now()
            self.session.add(scenario)
        
        # 롤백 버전 생성
        latest_version = self.session.exec(
            select(ScenarioVersion)
            .where(ScenarioVersion.scenario_id == scenario_id)
            .order_by(ScenarioVersion.created_at.desc())
        ).first()
        
        version_parts = latest_version.version.split('.') if latest_version else ["1", "0"]
        if len(version_parts) >= 2:
            major, minor = int(version_parts[0]), int(version_parts[1])
            new_version = f"{major}.{minor + 1}"
        else:
            new_version = "1.1"
        
        rollback_version = ScenarioVersion(
            scenario_id=scenario_id,
            version=new_version,
            version_status=VersionStatus.STABLE,
            notes=rollback_request.rollback_notes or f"버전 {target_version.version}으로 롤백",
            tag=f"rollback-{target_version.version}",
            snapshot=target_snapshot,
            auto_generated=False,
            created_by=user_id
        )
        
        self.session.add(rollback_version)
        self.session.commit()
        self.session.refresh(rollback_version)
        
        return rollback_version
    
    def get_version_history(
        self,
        scenario_id: uuid.UUID,
        include_auto: bool = True
    ) -> List[ScenarioVersion]:
        """
        시나리오의 버전 히스토리 조회
        
        Args:
            scenario_id: 시나리오 ID
            include_auto: 자동 생성 버전 포함 여부
            
        Returns:
            버전 목록 (최신순)
        """
        statement = select(ScenarioVersion).where(ScenarioVersion.scenario_id == scenario_id)
        
        if not include_auto:
            statement = statement.where(ScenarioVersion.auto_generated == False)
        
        statement = statement.order_by(ScenarioVersion.created_at.desc())
        
        return self.session.exec(statement).all()
    
    def _create_scenario_snapshot(self, scenario_id: uuid.UUID) -> Dict[str, Any]:
        """시나리오의 현재 상태 스냅샷 생성"""
        scenario = self.session.get(Scenario, scenario_id)
        nodes = self.session.exec(
            select(ScenarioNode).where(ScenarioNode.scenario_id == scenario_id)
        ).all()
        connections = self.session.exec(
            select(ScenarioConnection).where(ScenarioConnection.scenario_id == scenario_id)
        ).all()
        
        return {
            "scenario": scenario.model_dump() if scenario else {},
            "nodes": [node.model_dump() for node in nodes],
            "connections": [conn.model_dump() for conn in connections],
            "timestamp": datetime.now().isoformat()
        }
    
    def _generate_change_summary(
        self, 
        snapshot_old: Dict[str, Any], 
        snapshot_new: Dict[str, Any]
    ) -> Dict[str, Any]:
        """두 스냅샷 간의 변경 요약 생성"""
        nodes_old = {node['node_id']: node for node in snapshot_old.get('nodes', [])}
        nodes_new = {node['node_id']: node for node in snapshot_new.get('nodes', [])}
        
        connections_old = snapshot_old.get('connections', [])
        connections_new = snapshot_new.get('connections', [])
        
        summary = {
            "nodes": {
                "added": len([n for n in nodes_new if n not in nodes_old]),
                "deleted": len([n for n in nodes_old if n not in nodes_new]),
                "modified": len([
                    n for n in nodes_new 
                    if n in nodes_old and nodes_old[n] != nodes_new[n]
                ])
            },
            "connections": {
                "added": len(connections_new) - len(connections_old) if len(connections_new) > len(connections_old) else 0,
                "deleted": len(connections_old) - len(connections_new) if len(connections_old) > len(connections_new) else 0,
                "modified": 0  # 상세 분석 필요
            },
            "generated_at": datetime.now().isoformat()
        }
        
        return summary
    
    def _analyze_node_changes(
        self, 
        node_old: Dict[str, Any], 
        node_new: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """노드의 상세 변경 사항 분석"""
        changes = []
        
        for key in node_new:
            if key in node_old:
                if node_old[key] != node_new[key]:
                    changes.append({
                        "field": key,
                        "old_value": node_old[key],
                        "new_value": node_new[key]
                    })
            else:
                changes.append({
                    "field": key,
                    "old_value": None,
                    "new_value": node_new[key]
                })
        
        for key in node_old:
            if key not in node_new:
                changes.append({
                    "field": key,
                    "old_value": node_old[key],
                    "new_value": None
                })
        
        return changes
