# backend/app/api/routes/deployments.py
import uuid
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlmodel import select, and_

from app.api.deps import CurrentUser, SessionDep
from app.models.deployment import (
    Deployment, DeploymentCreate, DeploymentUpdate, DeploymentPublic,
    DeploymentHistory, DeploymentEnvironment, DeploymentStatus
)
from app.models.scenario import Scenario, ScenarioStatus
from app.services.deployment_service import deployment_service

router = APIRouter(prefix="/deployments", tags=["deployments"])

@router.post("/", response_model=DeploymentPublic)
async def create_deployment(
    *,
    session: SessionDep,
    deployment_in: DeploymentCreate,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks
) -> Deployment:
    """새 배포 생성 및 시작"""
    # 시나리오 존재 확인
    scenario = session.get(Scenario, deployment_in.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="시나리오를 찾을 수 없습니다.")
    
    # 프로덕션 배포 시 추가 검증
    if deployment_in.environment == DeploymentEnvironment.PRODUCTION:
        # TTS 완성도 확인
        # (실제로는 scenario_tts 서비스에서 확인)
        pass
        
        # 활성 상태 확인
        if scenario.status != ScenarioStatus.TESTING:
            raise HTTPException(
                status_code=400, 
                detail="프로덕션 배포는 테스트 상태의 시나리오만 가능합니다."
            )
    
    # 기존 같은 환경의 배포 상태 확인
    existing_deployment = session.exec(
        select(Deployment).where(
            and_(
                Deployment.scenario_id == deployment_in.scenario_id,
                Deployment.environment == deployment_in.environment,
                Deployment.status.in_([DeploymentStatus.PENDING, DeploymentStatus.DEPLOYING])
            )
        )
    ).first()
    
    if existing_deployment:
        raise HTTPException(
            status_code=400, 
            detail=f"{deployment_in.environment} 환경에 이미 진행 중인 배포가 있습니다."
        )
    
    # 배포 생성
    deployment = Deployment(
        **deployment_in.model_dump(),
        deployed_by=current_user.id,
        status=DeploymentStatus.PENDING
    )
    session.add(deployment)
    session.commit()
    session.refresh(deployment)
    
    # 배포 히스토리 기록
    history = DeploymentHistory(
        deployment_id=deployment.id,
        action="deploy",
        status="started",
        message=f"배포 시작: {deployment.environment} 환경"
    )
    session.add(history)
    session.commit()
    
    # 백그라운드에서 배포 실행
    background_tasks.add_task(
        deployment_service.execute_deployment,
        deployment.id
    )
    
    return deployment

@router.get("/", response_model=List[DeploymentPublic])
def get_deployments(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
    scenario_id: Optional[uuid.UUID] = None,
    environment: Optional[DeploymentEnvironment] = None,
    status: Optional[DeploymentStatus] = None
) -> List[Deployment]:
    """배포 목록 조회"""
    statement = select(Deployment)
    
    # 필터 적용
    if scenario_id:
        statement = statement.where(Deployment.scenario_id == scenario_id)
    if environment:
        statement = statement.where(Deployment.environment == environment)
    if status:
        statement = statement.where(Deployment.status == status)
    
    statement = statement.offset(skip).limit(limit).order_by(Deployment.created_at.desc())
    deployments = session.exec(statement).all()
    return deployments

@router.get("/{deployment_id}", response_model=DeploymentPublic)
def get_deployment(
    *,
    session: SessionDep,
    deployment_id: uuid.UUID,
    current_user: CurrentUser
) -> Deployment:
    """특정 배포 조회"""
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다.")
    
    return deployment

@router.post("/{deployment_id}/rollback")
async def rollback_deployment(
    *,
    session: SessionDep,
    deployment_id: uuid.UUID,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks
):
    """배포 롤백"""
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다.")
    
    if deployment.status != DeploymentStatus.DEPLOYED:
        raise HTTPException(status_code=400, detail="배포된 상태에서만 롤백이 가능합니다.")
    
    # 롤백할 이전 버전 확인
    if not deployment.rollback_version:
        # 이전 성공 배포 찾기
        previous_deployment = session.exec(
            select(Deployment).where(
                and_(
                    Deployment.scenario_id == deployment.scenario_id,
                    Deployment.environment == deployment.environment,
                    Deployment.status == DeploymentStatus.DEPLOYED,
                    Deployment.id != deployment_id
                )
            ).order_by(Deployment.completed_at.desc())
        ).first()
        
        if not previous_deployment:
            raise HTTPException(status_code=400, detail="롤백할 이전 버전이 없습니다.")
        
        rollback_version = previous_deployment.version
    else:
        rollback_version = deployment.rollback_version
    
    # 롤백 상태로 변경
    deployment.status = DeploymentStatus.PENDING  # 롤백 처리 중
    session.add(deployment)
    session.commit()
    
    # 롤백 히스토리 기록
    history = DeploymentHistory(
        deployment_id=deployment.id,
        action="rollback",
        status="started",
        message=f"롤백 시작: {rollback_version} 버전으로",
        metadata={"rollback_version": rollback_version}
    )
    session.add(history)
    session.commit()
    
    # 백그라운드에서 롤백 실행
    background_tasks.add_task(
        deployment_service.execute_rollback,
        deployment.id,
        rollback_version
    )
    
    return {"message": "롤백이 시작되었습니다.", "rollback_version": rollback_version}

@router.get("/{deployment_id}/history")
def get_deployment_history(
    *,
    session: SessionDep,
    deployment_id: uuid.UUID,
    current_user: CurrentUser
) -> List[DeploymentHistory]:
    """배포 히스토리 조회"""
    statement = select(DeploymentHistory).where(
        DeploymentHistory.deployment_id == deployment_id
    ).order_by(DeploymentHistory.created_at.desc())
    
    history = session.exec(statement).all()
    return history

@router.post("/{deployment_id}/cancel")
def cancel_deployment(
    *,
    session: SessionDep,
    deployment_id: uuid.UUID,
    current_user: CurrentUser
):
    """배포 취소"""
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다.")
    
    if deployment.status not in [DeploymentStatus.PENDING, DeploymentStatus.DEPLOYING]:
        raise HTTPException(status_code=400, detail="취소할 수 있는 상태가 아닙니다.")
    
    # 배포 취소 처리
    deployment.status = DeploymentStatus.FAILED
    deployment.error_message = "사용자에 의해 취소됨"
    deployment.completed_at = datetime.now()
    
    session.add(deployment)
    session.commit()
    
    # 취소 히스토리 기록
    history = DeploymentHistory(
        deployment_id=deployment.id,
        action="cancel",
        status="cancelled",
        message="사용자에 의해 배포가 취소되었습니다."
    )
    session.add(history)
    session.commit()
    
    return {"message": "배포가 취소되었습니다."}

@router.get("/scenario/{scenario_id}/latest")
def get_latest_deployments(
    *,
    session: SessionDep,
    scenario_id: uuid.UUID,
    current_user: CurrentUser
) -> dict:
    """시나리오의 환경별 최신 배포 상태 조회"""
    result = {}
    
    for env in DeploymentEnvironment:
        latest_deployment = session.exec(
            select(Deployment).where(
                and_(
                    Deployment.scenario_id == scenario_id,
                    Deployment.environment == env
                )
            ).order_by(Deployment.created_at.desc())
        ).first()
        
        if latest_deployment:
            result[env.value] = {
                "deployment_id": latest_deployment.id,
                "version": latest_deployment.version,
                "status": latest_deployment.status,
                "deployed_at": latest_deployment.completed_at,
                "deployed_by": latest_deployment.deployed_by
            }
        else:
            result[env.value] = None
    
    return result

@router.post("/{deployment_id}/health-check")
async def deployment_health_check(
    *,
    session: SessionDep,
    deployment_id: uuid.UUID,
    current_user: CurrentUser
):
    """배포 상태 헬스체크"""
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다.")
    
    # 헬스체크 실행
    health_status = await deployment_service.check_deployment_health(deployment_id)
    
    # 헬스체크 히스토리 기록
    history = DeploymentHistory(
        deployment_id=deployment.id,
        action="healthcheck",
        status="completed",
        message="헬스체크 실행",
        metadata=health_status
    )
    session.add(history)
    session.commit()
    
    return health_status
