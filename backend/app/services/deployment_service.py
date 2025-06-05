# backend/app/services/deployment_service.py
import uuid
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from sqlmodel import Session, select
from app.core.db import engine
from app.models.deployment import Deployment, DeploymentHistory, DeploymentStatus
from app.models.scenario import Scenario, ScenarioStatus

logger = logging.getLogger(__name__)

class DeploymentService:
    """배포 관리 서비스"""
    
    def __init__(self):
        self.deployment_configs = {
            "development": {
                "health_check_timeout": 30,
                "rollback_timeout": 60,
                "pre_deploy_checks": ["syntax", "basic_validation"]
            },
            "staging": {
                "health_check_timeout": 60,
                "rollback_timeout": 120,
                "pre_deploy_checks": ["syntax", "basic_validation", "tts_completion"]
            },
            "production": {
                "health_check_timeout": 120,
                "rollback_timeout": 300,
                "pre_deploy_checks": ["syntax", "basic_validation", "tts_completion", "approval"]
            }
        }
    
    async def execute_deployment(self, deployment_id: uuid.UUID) -> bool:
        """배포 실행"""
        with Session(engine) as session:
            deployment = session.get(Deployment, deployment_id)
            if not deployment:
                logger.error(f"Deployment {deployment_id} not found")
                return False
            
            try:
                # 배포 시작
                deployment.status = DeploymentStatus.DEPLOYING
                deployment.started_at = datetime.now()
                session.add(deployment)
                session.commit()
                
                await self._log_deployment_step(
                    session, deployment_id, "deploy", "started", "배포 시작"
                )
                
                # 1. 사전 검증
                logger.info(f"Starting pre-deployment checks for {deployment_id}")
                if not await self._run_pre_deploy_checks(session, deployment):
                    raise Exception("사전 검증 실패")
                
                # 2. 시나리오 데이터 준비
                logger.info(f"Preparing scenario data for {deployment_id}")
                scenario_data = await self._prepare_scenario_data(session, deployment)
                
                # 3. 실제 배포 실행
                logger.info(f"Executing deployment for {deployment_id}")
                await self._execute_deployment_to_environment(deployment, scenario_data)
                
                # 4. 헬스체크
                logger.info(f"Running health check for {deployment_id}")
                if not await self._run_health_check(deployment):
                    raise Exception("헬스체크 실패")
                
                # 5. 배포 완료
                deployment.status = DeploymentStatus.DEPLOYED
                deployment.completed_at = datetime.now()
                session.add(deployment)
                
                # 시나리오 상태 업데이트
                scenario = session.get(Scenario, deployment.scenario_id)
                if scenario:
                    if deployment.environment == "production":
                        scenario.status = ScenarioStatus.ACTIVE
                        scenario.deployed_at = datetime.now()
                    elif deployment.environment == "staging":
                        scenario.status = ScenarioStatus.TESTING
                    session.add(scenario)
                
                session.commit()
                
                await self._log_deployment_step(
                    session, deployment_id, "deploy", "completed", 
                    f"배포 완료: {deployment.environment} 환경"
                )
                
                logger.info(f"Deployment {deployment_id} completed successfully")
                return True
                
            except Exception as e:
                logger.error(f"Deployment {deployment_id} failed: {e}")
                
                # 실패 상태로 업데이트
                deployment.status = DeploymentStatus.FAILED
                deployment.error_message = str(e)
                deployment.completed_at = datetime.now()
                session.add(deployment)
                session.commit()
                
                await self._log_deployment_step(
                    session, deployment_id, "deploy", "failed", f"배포 실패: {str(e)}"
                )
                
                return False
    
    async def execute_rollback(self, deployment_id: uuid.UUID, rollback_version: str) -> bool:
        """롤백 실행"""
        with Session(engine) as session:
            deployment = session.get(Deployment, deployment_id)
            if not deployment:
                logger.error(f"Deployment {deployment_id} not found")
                return False
            
            try:
                await self._log_deployment_step(
                    session, deployment_id, "rollback", "started", 
                    f"롤백 시작: {rollback_version} 버전으로"
                )
                
                # 롤백 실행 (실제로는 이전 버전 재배포)
                await self._execute_rollback_to_environment(deployment, rollback_version)
                
                # 롤백 완료
                deployment.status = DeploymentStatus.ROLLED_BACK
                deployment.completed_at = datetime.now()
                session.add(deployment)
                session.commit()
                
                await self._log_deployment_step(
                    session, deployment_id, "rollback", "completed", 
                    f"롤백 완료: {rollback_version} 버전"
                )
                
                logger.info(f"Rollback {deployment_id} completed successfully")
                return True
                
            except Exception as e:
                logger.error(f"Rollback {deployment_id} failed: {e}")
                
                deployment.status = DeploymentStatus.FAILED
                deployment.error_message = f"롤백 실패: {str(e)}"
                deployment.completed_at = datetime.now()
                session.add(deployment)
                session.commit()
                
                await self._log_deployment_step(
                    session, deployment_id, "rollback", "failed", f"롤백 실패: {str(e)}"
                )
                
                return False
    
    async def check_deployment_health(self, deployment_id: uuid.UUID) -> Dict[str, Any]:
        """배포 헬스체크"""
        with Session(engine) as session:
            deployment = session.get(Deployment, deployment_id)
            if not deployment:
                return {"status": "error", "message": "배포를 찾을 수 없습니다."}
            
            health_status = {
                "deployment_id": str(deployment_id),
                "environment": deployment.environment,
                "version": deployment.version,
                "status": "healthy",
                "checks": {},
                "timestamp": datetime.now().isoformat()
            }
            
            try:
                # 1. 배포 상태 확인
                health_status["checks"]["deployment_status"] = {
                    "status": "pass" if deployment.status == DeploymentStatus.DEPLOYED else "fail",
                    "message": f"배포 상태: {deployment.status}"
                }
                
                # 2. 시나리오 데이터 무결성 확인
                scenario = session.get(Scenario, deployment.scenario_id)
                if scenario:
                    health_status["checks"]["scenario_integrity"] = {
                        "status": "pass",
                        "message": f"시나리오 상태: {scenario.status}"
                    }
                else:
                    health_status["checks"]["scenario_integrity"] = {
                        "status": "fail",
                        "message": "시나리오를 찾을 수 없습니다."
                    }
                
                # 3. TTS 파일 존재 확인 (staging, production 환경)
                if deployment.environment in ["staging", "production"]:
                    tts_health = await self._check_tts_files_health(deployment.scenario_id)
                    health_status["checks"]["tts_files"] = tts_health
                
                # 4. 환경별 추가 체크
                env_health = await self._check_environment_health(deployment)
                health_status["checks"]["environment"] = env_health
                
                # 전체 상태 결정
                failed_checks = [
                    check for check in health_status["checks"].values() 
                    if check["status"] == "fail"
                ]
                
                if failed_checks:
                    health_status["status"] = "unhealthy"
                    health_status["message"] = f"{len(failed_checks)}개 체크 실패"
                else:
                    health_status["status"] = "healthy"
                    health_status["message"] = "모든 체크 통과"
                
            except Exception as e:
                logger.error(f"Health check failed for {deployment_id}: {e}")
                health_status["status"] = "error"
                health_status["message"] = f"헬스체크 오류: {str(e)}"
            
            return health_status
    
    async def _run_pre_deploy_checks(self, session: Session, deployment: Deployment) -> bool:
        """배포 전 검증"""
        config = self.deployment_configs.get(deployment.environment, {})
        checks = config.get("pre_deploy_checks", [])
        
        for check in checks:
            try:
                if check == "syntax":
                    # 시나리오 구문 검증
                    if not await self._validate_scenario_syntax(session, deployment.scenario_id):
                        await self._log_deployment_step(
                            session, deployment.id, "validation", "failed", "구문 검증 실패"
                        )
                        return False
                
                elif check == "basic_validation":
                    # 기본 유효성 검증
                    if not await self._validate_scenario_basic(session, deployment.scenario_id):
                        await self._log_deployment_step(
                            session, deployment.id, "validation", "failed", "기본 검증 실패"
                        )
                        return False
                
                elif check == "tts_completion":
                    # TTS 완성도 검증
                    if not await self._validate_tts_completion(session, deployment.scenario_id):
                        await self._log_deployment_step(
                            session, deployment.id, "validation", "failed", "TTS 완성도 검증 실패"
                        )
                        return False
                
                await self._log_deployment_step(
                    session, deployment.id, "validation", "passed", f"{check} 검증 통과"
                )
                
            except Exception as e:
                logger.error(f"Pre-deploy check {check} failed: {e}")
                return False
        
        return True
    
    async def _prepare_scenario_data(self, session: Session, deployment: Deployment) -> Dict[str, Any]:
        """시나리오 배포 데이터 준비"""
        from app.models.scenario import ScenarioNode, ScenarioConnection
        
        scenario = session.get(Scenario, deployment.scenario_id)
        if not scenario:
            raise Exception("시나리오를 찾을 수 없습니다.")
        
        # 노드 데이터 조회
        nodes = session.exec(
            select(ScenarioNode).where(ScenarioNode.scenario_id == deployment.scenario_id)
        ).all()
        
        # 연결 데이터 조회
        connections = session.exec(
            select(ScenarioConnection).where(ScenarioConnection.scenario_id == deployment.scenario_id)
        ).all()
        
        # TTS 데이터 조회 (있는 경우)
        tts_data = {}
        try:
            from app.models.scenario_tts import ScenarioTTS
            tts_list = session.exec(
                select(ScenarioTTS).where(
                    ScenarioTTS.scenario_id == deployment.scenario_id,
                    ScenarioTTS.is_active == True
                )
            ).all()
            
            tts_data = {
                tts.node_id: {
                    "audio_file_path": tts.audio_file_path,
                    "text_content": tts.text_content,
                    "voice_settings": tts.voice_settings
                }
                for tts in tts_list if tts.audio_file_path
            }
        except ImportError:
            # ScenarioTTS 모델이 없는 경우
            pass
        
        scenario_data = {
            "scenario": scenario.model_dump(),
            "nodes": [node.model_dump() for node in nodes],
            "connections": [conn.model_dump() for conn in connections],
            "tts_data": tts_data,
            "deployment_info": {
                "version": deployment.version,
                "environment": deployment.environment,
                "deployed_at": datetime.now().isoformat()
            }
        }
        
        return scenario_data
    
    async def _execute_deployment_to_environment(self, deployment: Deployment, scenario_data: Dict[str, Any]):
        """환경별 실제 배포 실행"""
        # 실제 구현에서는 환경별로 다른 배포 로직 사용
        if deployment.environment == "development":
            await self._deploy_to_development(deployment, scenario_data)
        elif deployment.environment == "staging":
            await self._deploy_to_staging(deployment, scenario_data)
        elif deployment.environment == "production":
            await self._deploy_to_production(deployment, scenario_data)
    
    async def _deploy_to_development(self, deployment: Deployment, scenario_data: Dict[str, Any]):
        """개발 환경 배포"""
        # Mock 배포 (실제로는 개발 서버에 배포)
        await asyncio.sleep(2)  # 배포 시뮬레이션
        logger.info(f"Deployed to development: {deployment.id}")
    
    async def _deploy_to_staging(self, deployment: Deployment, scenario_data: Dict[str, Any]):
        """스테이징 환경 배포"""
        # Mock 배포 (실제로는 스테이징 서버에 배포)
        await asyncio.sleep(5)  # 배포 시뮬레이션
        logger.info(f"Deployed to staging: {deployment.id}")
    
    async def _deploy_to_production(self, deployment: Deployment, scenario_data: Dict[str, Any]):
        """프로덕션 환경 배포"""
        # Mock 배포 (실제로는 프로덕션 서버에 배포)
        await asyncio.sleep(10)  # 배포 시뮬레이션
        logger.info(f"Deployed to production: {deployment.id}")
    
    async def _run_health_check(self, deployment: Deployment) -> bool:
        """배포 후 헬스체크"""
        try:
            config = self.deployment_configs.get(deployment.environment, {})
            timeout = config.get("health_check_timeout", 60)
            
            # Mock 헬스체크 (실제로는 실제 환경 확인)
            await asyncio.sleep(min(timeout / 10, 3))  # 시뮬레이션
            
            # 90% 확률로 성공 (개발용)
            import random
            return random.random() > 0.1
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
    
    async def _execute_rollback_to_environment(self, deployment: Deployment, rollback_version: str):
        """환경별 롤백 실행"""
        # Mock 롤백 (실제로는 이전 버전 재배포)
        await asyncio.sleep(3)
        logger.info(f"Rolled back to version {rollback_version}")
    
    async def _validate_scenario_syntax(self, session: Session, scenario_id: uuid.UUID) -> bool:
        """시나리오 구문 검증"""
        # 기본 구문 검증 로직
        try:
            from app.models.scenario import ScenarioNode
            
            # 시작 노드 존재 확인
            start_nodes = session.exec(
                select(ScenarioNode).where(
                    ScenarioNode.scenario_id == scenario_id,
                    ScenarioNode.node_type == "start"
                )
            ).all()
            
            if len(start_nodes) != 1:
                return False
            
            return True
        except Exception:
            return False
    
    async def _validate_scenario_basic(self, session: Session, scenario_id: uuid.UUID) -> bool:
        """기본 유효성 검증"""
        try:
            from app.models.scenario import ScenarioNode, ScenarioConnection
            
            nodes = session.exec(
                select(ScenarioNode).where(ScenarioNode.scenario_id == scenario_id)
            ).all()
            
            connections = session.exec(
                select(ScenarioConnection).where(ScenarioConnection.scenario_id == scenario_id)
            ).all()
            
            # 최소 노드 수 확인
            if len(nodes) < 2:
                return False
            
            # 고립된 노드 확인
            connected_nodes = set()
            for conn in connections:
                connected_nodes.add(conn.source_node_id)
                connected_nodes.add(conn.target_node_id)
            
            # 시작 노드 제외하고 모든 노드가 연결되어 있는지 확인
            start_node = next((n for n in nodes if n.node_type == "start"), None)
            if start_node:
                connected_nodes.add(start_node.node_id)
            
            for node in nodes:
                if node.node_id not in connected_nodes:
                    return False
            
            return True
        except Exception:
            return False
    
    async def _validate_tts_completion(self, session: Session, scenario_id: uuid.UUID) -> bool:
        """TTS 완성도 검증"""
        try:
            from app.models.scenario import ScenarioNode
            from app.models.scenario_tts import ScenarioTTS
            
            # 메시지 노드들 조회
            message_nodes = session.exec(
                select(ScenarioNode).where(
                    ScenarioNode.scenario_id == scenario_id,
                    ScenarioNode.node_type == "message"
                )
            ).all()
            
            if not message_nodes:
                return True  # 메시지 노드가 없으면 통과
            
            # 활성 TTS 조회
            active_tts = session.exec(
                select(ScenarioTTS).where(
                    ScenarioTTS.scenario_id == scenario_id,
                    ScenarioTTS.is_active == True,
                    ScenarioTTS.audio_file_path.isnot(None)
                )
            ).all()
            
            tts_node_ids = {tts.node_id for tts in active_tts}
            message_node_ids = {node.node_id for node in message_nodes}
            
            # 모든 메시지 노드에 TTS가 있는지 확인
            completion_rate = len(tts_node_ids & message_node_ids) / len(message_node_ids)
            
            # 90% 이상 완성되어야 함
            return completion_rate >= 0.9
            
        except Exception:
            return False
    
    async def _check_tts_files_health(self, scenario_id: uuid.UUID) -> Dict[str, Any]:
        """TTS 파일 상태 확인"""
        try:
            with Session(engine) as session:
                from app.models.scenario_tts import ScenarioTTS
                
                tts_list = session.exec(
                    select(ScenarioTTS).where(
                        ScenarioTTS.scenario_id == scenario_id,
                        ScenarioTTS.is_active == True
                    )
                ).all()
                
                total_files = len(tts_list)
                existing_files = 0
                
                for tts in tts_list:
                    if tts.audio_file_path and Path(tts.audio_file_path).exists():
                        existing_files += 1
                
                if total_files == 0:
                    return {"status": "pass", "message": "TTS 파일이 없습니다."}
                
                success_rate = existing_files / total_files
                if success_rate >= 0.9:
                    return {
                        "status": "pass", 
                        "message": f"TTS 파일 {existing_files}/{total_files} 존재"
                    }
                else:
                    return {
                        "status": "fail", 
                        "message": f"TTS 파일 부족: {existing_files}/{total_files}"
                    }
        except Exception as e:
            return {"status": "fail", "message": f"TTS 파일 확인 오류: {str(e)}"}
    
    async def _check_environment_health(self, deployment: Deployment) -> Dict[str, Any]:
        """환경별 헬스체크"""
        # Mock 환경 헬스체크
        return {
            "status": "pass",
            "message": f"{deployment.environment} 환경 정상"
        }
    
    async def _log_deployment_step(
        self, 
        session: Session, 
        deployment_id: uuid.UUID, 
        action: str, 
        status: str, 
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """배포 단계 로그 기록"""
        history = DeploymentHistory(
            deployment_id=deployment_id,
            action=action,
            status=status,
            message=message,
            metadata=metadata
        )
        session.add(history)
        session.commit()

# 싱글톤 인스턴스
deployment_service = DeploymentService()
