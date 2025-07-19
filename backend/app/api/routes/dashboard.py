# backend/app/api/routes/dashboard.py
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func, and_, or_
from ..deps import get_current_user, get_db
from ...models.users import User
from ...models.scenario import Scenario, ScenarioStatus
from ...models.ment import Ment
from ...models.tts import TTSGeneration, GenerationStatus, TTSScript
from ...models.voice_actor import VoiceActor

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """대시보드 주요 통계 데이터를 반환합니다."""
    
    try:
        # 시나리오 통계
        total_scenarios_result = session.exec(select(func.count(Scenario.id))).first()
        total_scenarios = total_scenarios_result if total_scenarios_result is not None else 0
        
        active_scenarios_result = session.exec(
            select(func.count(Scenario.id)).where(Scenario.status == ScenarioStatus.ACTIVE)
        ).first()
        active_scenarios = active_scenarios_result if active_scenarios_result is not None else 0
        
        # TTS 통계
        tts_in_progress_result = session.exec(
            select(func.count(TTSGeneration.id)).where(
                or_(
                    TTSGeneration.status == GenerationStatus.PENDING,
                    TTSGeneration.status == GenerationStatus.PROCESSING
                )
            )
        ).first()
        tts_in_progress = tts_in_progress_result if tts_in_progress_result is not None else 0
        
        # 오늘 완료된 TTS
        today = datetime.now().date()
        tts_completed_today_result = session.exec(
            select(func.count(TTSGeneration.id)).where(
                and_(
                    TTSGeneration.status == GenerationStatus.COMPLETED,
                    func.date(TTSGeneration.completed_at) == today
                )
            )
        ).first()
        tts_completed_today = tts_completed_today_result if tts_completed_today_result is not None else 0
        
        # 성우 모델 통계
        total_voice_models_result = session.exec(select(func.count(VoiceActor.id))).first()
        total_voice_models = total_voice_models_result if total_voice_models_result is not None else 0
        
        active_voice_models_result = session.exec(
            select(func.count(VoiceActor.id)).where(VoiceActor.is_active == True)
        ).first()
        active_voice_models = active_voice_models_result if active_voice_models_result is not None else 0
        
        # 멘트 통계
        total_ments_result = session.exec(select(func.count(Ment.id))).first()
        total_ments = total_ments_result if total_ments_result is not None else 0
        
        # 시스템 상태 판단 (간단한 헬스체크)
        system_status = "정상"
        if tts_in_progress > 10:
            system_status = "주의"
        
        return {
            "activeScenarios": active_scenarios,
            "totalScenarios": total_scenarios,
            "ttsInProgress": tts_in_progress,
            "ttsCompletedToday": tts_completed_today,
            "voiceModels": total_voice_models,
            "activeVoiceModels": active_voice_models,
            "totalMents": total_ments,
            "systemStatus": system_status
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"통계 데이터 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/recent-scenarios")
async def get_recent_scenarios(
    limit: int = 5,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """최근 수정된 시나리오 목록을 반환합니다."""
    
    try:
        recent_scenarios = session.exec(
            select(Scenario)
            .order_by(Scenario.updated_at.desc())
            .limit(limit)
        ).all()
        
        result = []
        for scenario in recent_scenarios:
            result.append({
                "id": str(scenario.id),
                "name": scenario.name,
                "status": scenario.status.value if scenario.status else "draft",
                "lastModified": scenario.updated_at.strftime("%Y-%m-%d") if scenario.updated_at else datetime.now().strftime("%Y-%m-%d"),
                "category": scenario.category or "미분류"
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"최근 시나리오 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/tts-stats")
async def get_tts_stats(
    days: int = 7,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """TTS 생성 통계를 반환합니다."""
    
    try:
        # 지난 N일간의 데이터
        start_date = datetime.now() - timedelta(days=days)
        
        stats = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            date_str = date.strftime("%m/%d")
            
            # 해당 날짜의 완료된 TTS 수
            completed_count_result = session.exec(
                select(func.count(TTSGeneration.id)).where(
                    and_(
                        TTSGeneration.status == GenerationStatus.COMPLETED,
                        func.date(TTSGeneration.completed_at) == date.date()
                    )
                )
            ).first()
            completed_count = completed_count_result if completed_count_result is not None else 0
            
            # 해당 날짜의 평균 품질 점수
            avg_quality_result = session.exec(
                select(func.avg(TTSGeneration.quality_score)).where(
                    and_(
                        TTSGeneration.status == GenerationStatus.COMPLETED,
                        TTSGeneration.quality_score.is_not(None),
                        func.date(TTSGeneration.completed_at) == date.date()
                    )
                )
            ).first()
            avg_quality = avg_quality_result if avg_quality_result is not None else 0
            
            stats.append({
                "date": date_str,
                "count": completed_count,
                "quality": round(avg_quality, 1) if avg_quality else 0
            })
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"TTS 통계 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/scenario-status-distribution")
async def get_scenario_status_distribution(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """시나리오 상태별 분포를 반환합니다."""
    
    try:
        # 각 상태별 시나리오 수 조회
        status_counts = {}
        for status in ScenarioStatus:
            count_result = session.exec(
                select(func.count(Scenario.id)).where(Scenario.status == status)
            ).first()
            count = count_result if count_result is not None else 0
            status_counts[status.value] = count
        
        # 차트용 데이터 형식으로 변환
        colors = {
            "active": "#00C49F",
            "inactive": "#FFBB28", 
            "testing": "#FF8042",
            "draft": "#8884d8",
            "archived": "#82ca9d"
        }
        
        result = []
        korean_names = {
            "active": "활성",
            "inactive": "비활성",
            "testing": "테스트",
            "draft": "초안",
            "archived": "보관"
        }
        
        for status, count in status_counts.items():
            if count > 0:  # 0개인 상태는 제외
                result.append({
                    "name": korean_names.get(status, status),
                    "value": count,
                    "color": colors.get(status, "#8884d8")
                })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"시나리오 상태 분포 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/work-statuses")
async def get_work_statuses(
    limit: int = 5,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """진행 중인 작업 상태를 반환합니다."""
    
    try:
        work_statuses = []
        
        # 진행 중인 TTS 작업들
        processing_tts = session.exec(
            select(TTSGeneration, TTSScript)
            .join(TTSScript, TTSGeneration.script_id == TTSScript.id)
            .where(
                or_(
                    TTSGeneration.status == GenerationStatus.PENDING,
                    TTSGeneration.status == GenerationStatus.PROCESSING
                )
            )
            .order_by(TTSGeneration.created_at.desc())
            .limit(limit)
        ).all()
        
        for tts_gen, script in processing_tts:
            progress = None
            if tts_gen.status == GenerationStatus.PROCESSING:
                # 진행률 계산 (시작 시간 기준으로 추정)
                if tts_gen.started_at:
                    elapsed = (datetime.now() - tts_gen.started_at).total_seconds()
                    # 평균 생성 시간을 30초로 가정
                    progress = min(int((elapsed / 30) * 100), 95)
            
            work_statuses.append({
                "id": str(tts_gen.id),
                "type": "진행중" if tts_gen.status == GenerationStatus.PROCESSING else "대기",
                "message": f"TTS 생성 중: {script.text_content[:30]}..." if script and script.text_content else "TTS 생성 중...",
                "progress": progress
            })
        
        # 최근 완료된 작업들
        remaining_slots = max(0, limit - len(work_statuses))
        if remaining_slots > 0:
            completed_tts = session.exec(
                select(TTSGeneration, TTSScript)
                .join(TTSScript, TTSGeneration.script_id == TTSScript.id)
                .where(TTSGeneration.status == GenerationStatus.COMPLETED)
                .order_by(TTSGeneration.completed_at.desc())
                .limit(remaining_slots)
            ).all()
            
            for tts_gen, script in completed_tts:
                work_statuses.append({
                    "id": str(tts_gen.id),
                    "type": "완료",
                    "message": f"TTS 생성 완료: {script.text_content[:30]}..." if script and script.text_content else "TTS 생성 완료",
                    "progress": None
                })
        
        return work_statuses[:limit]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"작업 상태 조회 중 오류가 발생했습니다: {str(e)}"
        )