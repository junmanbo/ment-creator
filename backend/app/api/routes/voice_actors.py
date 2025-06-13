import uuid
import logging
from datetime import datetime
from typing import List, Optional
from pathlib import Path
from sqlmodel import SQLModel

logger = logging.getLogger(__name__)

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.voice_actor import (
    VoiceActor, VoiceActorCreate, VoiceActorUpdate, VoiceActorPublic,
    VoiceSample, VoiceSampleCreate, VoiceSamplePublic,
    GenderType, AgeRangeType
)
from app.models.tts import (
    TTSScript, TTSScriptCreate, TTSScriptUpdate, TTSScriptPublic, 
    TTSGeneration, TTSGenerateRequest, TTSGenerationPublic,
    TTSLibrary, TTSLibraryCreate, TTSLibraryUpdate, TTSLibraryPublic,
    GenerationStatus
)

# 🔄 TTS 서비스를 팩토리 패턴으로 교체
from app.services.tts_factory import get_tts_service

# TTS Generation with Script info
class TTSGenerationWithScript(TTSGenerationPublic):
    script: Optional[TTSScriptPublic] = None
    voice_actor_name: Optional[str] = None

# TTS Script with Voice Actor info
class TTSScriptWithVoiceActor(TTSScriptPublic):
    voice_actor_name: Optional[str] = None
    latest_generation: Optional[TTSGenerationPublic] = None

router = APIRouter(prefix="/voice-actors", tags=["voice-actors"])

# === 테스트 및 고정 경로 (path parameter보다 먼저 정의) ===

@router.get("/test")
def test_voice_actors_api():
    """API 테스트 엔드포인트"""
    return {"message": "Voice actors API is working", "timestamp": datetime.now().isoformat()}

@router.get("/api-test")
def test_voice_actors_api_2():
    """성우 API 기본 연결 테스트"""
    logger.info("🧪 Voice actors API test endpoint called")
    return {
        "message": "Voice actors API is working perfectly!", 
        "timestamp": datetime.now().isoformat(),
        "status": "healthy",
        "endpoints": {
            "voice_actors": "/voice-actors",
            "tts_scripts": "/voice-actors/tts-scripts",
            "tts_generations": "/voice-actors/tts-generations",
            "tts_library": "/voice-actors/tts-library",
            "debug_diagnosis": "/voice-actors/debug/diagnosis",
            "debug_fix": "/voice-actors/debug/fix-issues"
        }
    }

@router.get("/db-status")
def check_database_status(
    *,
    session: SessionDep,
    current_user: CurrentUser
):
    """데이터베이스 상태 확인"""
    logger.info(f"🔍 Database status check requested by user {current_user.id}")
    
    try:
        # 각 테이블의 레코드 수 확인
        from app.models.users import User
        
        users_count = len(session.exec(select(User)).all())
        voice_actors_count = len(session.exec(select(VoiceActor)).all())
        tts_scripts_count = len(session.exec(select(TTSScript)).all())
        tts_generations_count = len(session.exec(select(TTSGeneration)).all())
        
        # 현재 사용자의 TTS 스크립트 조회
        user_scripts = session.exec(
            select(TTSScript)
            .where(TTSScript.created_by == current_user.id)
            .order_by(TTSScript.created_at.desc())
            .limit(5)
        ).all()
        
        user_scripts_data = []
        for script in user_scripts:
            user_scripts_data.append({
                "id": str(script.id),
                "text_content": script.text_content[:100] + "..." if len(script.text_content) > 100 else script.text_content,
                "created_at": script.created_at.isoformat(),
                "voice_actor_id": str(script.voice_actor_id) if script.voice_actor_id else None
            })
        
        # 성우 목록 조회
        voice_actors = session.exec(select(VoiceActor).limit(10)).all()
        voice_actors_data = []
        for actor in voice_actors:
            voice_actors_data.append({
                "id": str(actor.id),
                "name": actor.name,
                "gender": actor.gender,
                "age_range": actor.age_range,
                "is_active": actor.is_active
            })
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "database_counts": {
                "users": users_count,
                "voice_actors": voice_actors_count,
                "tts_scripts": tts_scripts_count,
                "tts_generations": tts_generations_count
            },
            "current_user": {
                "id": str(current_user.id),
                "email": current_user.email,
                "scripts_count": len(user_scripts)
            },
            "user_scripts": user_scripts_data,
            "voice_actors": voice_actors_data
        }
        
    except Exception as e:
        logger.error(f"❌ Database status check failed: {e}")
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "error_type": type(e).__name__
        }

@router.post("/create-sample-data")
def create_sample_data(
    *,
    session: SessionDep,
    current_user: CurrentUser
):
    """샘플 데이터 생성"""
    logger.info(f"🛠️ Sample data creation requested by user {current_user.id}")
    
    try:
        created_items = []
        
        # 샘플 성우 생성
        sample_actor_data = {
            "name": "김서연",
            "gender": "female",
            "age_range": "30s",
            "language": "ko",
            "description": "친근하고 따뜻한 목소리의 전문 성우",
            "characteristics": {"tone": "친근함", "style": "밝음", "specialty": "보험업계"},
            "is_active": True,
            "created_by": current_user.id
        }
        
        existing_actor = session.exec(
            select(VoiceActor).where(VoiceActor.name == sample_actor_data["name"])
        ).first()
        
        if not existing_actor:
            from app.models.voice_actor import GenderType, AgeRangeType
            sample_actor = VoiceActor(
                name=sample_actor_data["name"],
                gender=GenderType.FEMALE,
                age_range=AgeRangeType.THIRTIES,
                language=sample_actor_data["language"],
                description=sample_actor_data["description"],
                characteristics=sample_actor_data["characteristics"],
                is_active=sample_actor_data["is_active"],
                created_by=current_user.id
            )
            session.add(sample_actor)
            session.commit()
            session.refresh(sample_actor)
            created_items.append(f"성우: {sample_actor.name}")
        else:
            sample_actor = existing_actor
            created_items.append(f"기존 성우 사용: {sample_actor.name}")
        
        # 샘플 TTS 스크립트들 생성
        sample_scripts = [
            {
                "text_content": "안녕하세요. OO손해보험 고객센터입니다. 무엇을 도와드릴까요?",
                "voice_settings": {"speed": 1.0, "tone": "friendly", "emotion": "bright"}
            },
            {
                "text_content": "메뉴를 선택해 주세요. 1번 자동차보험, 2번 화재보험, 9번 상담원 연결입니다.",
                "voice_settings": {"speed": 0.9, "tone": "clear", "emotion": "neutral"}
            },
            {
                "text_content": "상담원에게 연결해 드리겠습니다. 잠시만 기다려 주세요.",
                "voice_settings": {"speed": 1.0, "tone": "polite", "emotion": "calm"}
            },
            {
                "text_content": "감사합니다. 좋은 하루 되세요.",
                "voice_settings": {"speed": 1.0, "tone": "warm", "emotion": "bright"}
            }
        ]
        
        scripts_created = 0
        for script_data in sample_scripts:
            existing_script = session.exec(
                select(TTSScript).where(
                    TTSScript.text_content == script_data["text_content"]
                ).where(
                    TTSScript.created_by == current_user.id
                )
            ).first()
            
            if not existing_script:
                new_script = TTSScript(
                    text_content=script_data["text_content"],
                    voice_actor_id=sample_actor.id,
                    voice_settings=script_data["voice_settings"],
                    created_by=current_user.id
                )
                session.add(new_script)
                scripts_created += 1
        
        if scripts_created > 0:
            session.commit()
            created_items.append(f"TTS 스크립트 {scripts_created}개")
        else:
            created_items.append("TTS 스크립트 (이미 존재함)")
        
        return {
            "status": "success",
            "message": "샘플 데이터 생성 완료",
            "timestamp": datetime.now().isoformat(),
            "created_items": created_items
        }
        
    except Exception as e:
        logger.error(f"❌ Sample data creation failed: {e}")
        return {
            "status": "error",
            "message": "샘플 데이터 생성 실패",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "error_type": type(e).__name__
        }

# === TTS 스크립트 관리 (고정 경로) ===

@router.post("/tts-scripts", response_model=TTSScriptPublic)
def create_tts_script(
    *,
    session: SessionDep,
    script_in: TTSScriptCreate,
    current_user: CurrentUser
) -> TTSScriptPublic:
    """TTS 스크립트 생성"""
    # 성우 존재 확인
    if script_in.voice_actor_id:
        voice_actor = session.get(VoiceActor, script_in.voice_actor_id)
        if not voice_actor:
            raise HTTPException(status_code=404, detail="성우를 찾을 수 없습니다.")
    
    script = TTSScript(
        **script_in.model_dump(),
        created_by=current_user.id
    )
    session.add(script)
    session.commit()
    session.refresh(script)
    
    try:
        return TTSScriptPublic.model_validate(script)
    except Exception as e:
        logger.error(f"❌ Failed to convert TTS script {script.id}: {e}")
        raise HTTPException(status_code=500, detail="TTS 스크립트 데이터 변환 중 오류가 발생했습니다.")

@router.get("/tts-scripts", response_model=List[TTSScriptWithVoiceActor])
def get_tts_scripts(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
    voice_actor_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> List[TTSScriptWithVoiceActor]:
    """TTS 스크립트 목록 조회 (성우 정보 및 최신 생성 결과 포함)"""
    logger.info(f"🎯 GET /tts-scripts called with filters: voice_actor_id={voice_actor_id}, search={search}")
    
    try:
        # 스크립트와 성우 정보를 함께 조회
        statement = (
            select(
                TTSScript,
                VoiceActor.name.label("voice_actor_name")
            )
            .outerjoin(VoiceActor, TTSScript.voice_actor_id == VoiceActor.id)
            .where(TTSScript.created_by == current_user.id)
        )
        
        # 필터 적용
        if voice_actor_id:
            statement = statement.where(TTSScript.voice_actor_id == voice_actor_id)
        
        if search:
            search_term = f"%{search}%"
            statement = statement.where(TTSScript.text_content.ilike(search_term))
        
        # 정렬
        if sort_by == "created_at":
            order_column = TTSScript.created_at
        elif sort_by == "updated_at":
            order_column = TTSScript.updated_at
        elif sort_by == "text_content":
            order_column = TTSScript.text_content
        else:
            order_column = TTSScript.created_at
        
        if sort_order == "desc":
            order_column = order_column.desc()
        else:
            order_column = order_column.asc()
        
        statement = statement.order_by(order_column).offset(skip).limit(limit)
        
        results = session.exec(statement).all()
        
        # 각 스크립트에 대해 최신 생성 결과 조회
        scripts_with_info = []
        for script, voice_actor_name in results:
            script_dict = script.model_dump()
            script_dict["voice_actor_name"] = voice_actor_name
            
            # 최신 생성 결과 조회
            latest_generation_stmt = (
                select(TTSGeneration)
                .where(TTSGeneration.script_id == script.id)
                .order_by(TTSGeneration.created_at.desc())
                .limit(1)
            )
            latest_generation = session.exec(latest_generation_stmt).first()
            
            if latest_generation:
                script_dict["latest_generation"] = latest_generation.model_dump()
            else:
                script_dict["latest_generation"] = None
            
            scripts_with_info.append(TTSScriptWithVoiceActor(**script_dict))
        
        logger.info(f"✅ Successfully retrieved {len(scripts_with_info)} TTS scripts")
        return scripts_with_info
        
    except Exception as e:
        logger.error(f"💥 ERROR in get_tts_scripts: {e}")
        raise HTTPException(status_code=500, detail=f"TTS 스크립트 목록 조회 중 오류: {str(e)}")

@router.get("/tts-scripts/{script_id}", response_model=TTSScriptWithVoiceActor)
def get_tts_script(
    *,
    session: SessionDep,
    script_id: uuid.UUID,
    current_user: CurrentUser
) -> TTSScriptWithVoiceActor:
    """특정 TTS 스크립트 조회"""
    script = session.get(TTSScript, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="스크립트를 찾을 수 없습니다.")
    
    if script.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    
    # 성우 정보 조회
    voice_actor_name = None
    if script.voice_actor_id:
        voice_actor = session.get(VoiceActor, script.voice_actor_id)
        if voice_actor:
            voice_actor_name = voice_actor.name
    
    # 최신 생성 결과 조회
    latest_generation_stmt = (
        select(TTSGeneration)
        .where(TTSGeneration.script_id == script.id)
        .order_by(TTSGeneration.created_at.desc())
        .limit(1)
    )
    latest_generation = session.exec(latest_generation_stmt).first()
    
    script_dict = script.model_dump()
    script_dict["voice_actor_name"] = voice_actor_name
    script_dict["latest_generation"] = latest_generation.model_dump() if latest_generation else None
    
    return TTSScriptWithVoiceActor(**script_dict)

@router.put("/tts-scripts/{script_id}", response_model=TTSScriptPublic)
def update_tts_script(
    *,
    session: SessionDep,
    script_id: uuid.UUID,
    script_in: TTSScriptUpdate,
    current_user: CurrentUser
) -> TTSScriptPublic:
    """TTS 스크립트 수정"""
    script = session.get(TTSScript, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="스크립트를 찾을 수 없습니다.")
    
    if script.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    
    # 성우 존재 확인
    if script_in.voice_actor_id:
        voice_actor = session.get(VoiceActor, script_in.voice_actor_id)
        if not voice_actor:
            raise HTTPException(status_code=404, detail="성우를 찾을 수 없습니다.")
    
    update_data = script_in.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now()
    script.sqlmodel_update(update_data)
    
    session.add(script)
    session.commit()
    session.refresh(script)
    
    try:
        return TTSScriptPublic.model_validate(script)
    except Exception as e:
        logger.error(f"❌ Failed to convert updated TTS script {script_id}: {e}")
        raise HTTPException(status_code=500, detail="TTS 스크립트 데이터 변환 중 오류가 발생했습니다.")

@router.delete("/tts-scripts/{script_id}")
def delete_tts_script(
    *,
    session: SessionDep,
    script_id: uuid.UUID,
    current_user: CurrentUser
):
    """TTS 스크립트 삭제"""
    script = session.get(TTSScript, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="스크립트를 찾을 수 없습니다.")
    
    if script.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    
    # 관련된 생성 작업들도 함께 삭제
    generations = session.exec(
        select(TTSGeneration).where(TTSGeneration.script_id == script_id)
    ).all()
    
    for generation in generations:
        # 오디오 파일 삭제
        if generation.audio_file_path:
            try:
                file_path = Path(generation.audio_file_path)
                if file_path.exists():
                    file_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete audio file {generation.audio_file_path}: {e}")
        
        session.delete(generation)
    
    session.delete(script)
    session.commit()
    
    return {"message": "TTS 스크립트가 삭제되었습니다."}

@router.post("/tts-scripts/{script_id}/generate", response_model=TTSGenerationPublic)
async def generate_tts(
    *,
    session: SessionDep,
    script_id: uuid.UUID,
    generate_request: TTSGenerateRequest,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks
) -> TTSGenerationPublic:
    """TTS 생성 요청 (팩토리 패턴 사용)"""
    # 스크립트 확인
    script = session.get(TTSScript, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="스크립트를 찾을 수 없습니다.")
    
    # 생성 작업 생성
    generation = TTSGeneration(
        script_id=script_id,
        generation_params=generate_request.generation_params,
        requested_by=current_user.id
    )
    
    session.add(generation)
    session.commit()
    session.refresh(generation)
    
    # 🔄 팩토리에서 현재 TTS 서비스 가져오기
    tts_service = get_tts_service()
    
    # 백그라운드에서 TTS 생성 처리
    background_tasks.add_task(
        tts_service.process_tts_generation,
        generation.id
    )
    
    try:
        return TTSGenerationPublic.model_validate(generation)
    except Exception as e:
        logger.error(f"❌ Failed to convert TTS generation {generation.id}: {e}")
        raise HTTPException(status_code=500, detail="TTS 생성 데이터 변환 중 오류가 발생했습니다.")

@router.post("/tts-scripts/batch-generate")
async def batch_generate_tts(
    *,
    session: SessionDep,
    batch_request: 'BatchTTSRequest',
    current_user: CurrentUser,
    background_tasks: BackgroundTasks
):
    """여러 TTS 스크립트를 한 번에 생성 (팩토리 패턴 사용)"""
    if not batch_request.script_ids:
        raise HTTPException(status_code=400, detail="스크립트 ID가 없습니다.")
    
    if len(batch_request.script_ids) > 20:  # 최대 20개로 제한
        raise HTTPException(status_code=400, detail="한 번에 최대 20개의 스크립트만 처리할 수 있습니다.")
    
    # 스크립트 소유권 확인
    for script_id in batch_request.script_ids:
        script = session.get(TTSScript, script_id)
        if not script:
            raise HTTPException(status_code=404, detail=f"스크립트 {script_id}를 찾을 수 없습니다.")
        if script.created_by != current_user.id:
            raise HTTPException(status_code=403, detail=f"스크립트 {script_id}에 대한 권한이 없습니다.")
    
    # 🔄 팩토리에서 현재 TTS 서비스 가져오기
    tts_service = get_tts_service()
    
    # 배치 생성 시작
    try:
        results = await tts_service.batch_generate_tts(
            batch_request.script_ids,
            batch_request.force_regenerate
        )
        
        return {
            "message": "배치 TTS 생성이 시작되었습니다.",
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Batch TTS generation failed: {e}")
        raise HTTPException(status_code=500, detail="배치 생성 중 오류가 발생했습니다.")

# === TTS 생성 관리 ===

@router.get("/tts-generations/{generation_id}", response_model=TTSGenerationPublic)
def get_tts_generation(
    *,
    session: SessionDep,
    generation_id: uuid.UUID,
    current_user: CurrentUser
) -> TTSGeneration:
    """TTS 생성 상태 조회"""
    generation = session.get(TTSGeneration, generation_id)
    if not generation:
        raise HTTPException(status_code=404, detail="생성 작업을 찾을 수 없습니다.")
    
    if generation.requested_by != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    
    return generation

@router.get("/tts-generations/{generation_id}/audio")
def stream_generated_audio(
    *,
    session: SessionDep,
    generation_id: uuid.UUID,
    current_user: CurrentUser
) -> StreamingResponse:
    """생성된 TTS 오디오 스트리밍"""
    generation = session.get(TTSGeneration, generation_id)
    if not generation:
        raise HTTPException(status_code=404, detail="생성 작업을 찾을 수 없습니다.")
    
    if generation.requested_by != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    
    if not generation.audio_file_path:
        raise HTTPException(status_code=404, detail="생성된 오디오 파일이 없습니다.")
    
    file_path = Path(generation.audio_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="오디오 파일을 찾을 수 없습니다.")
    
    def iterfile():
        with open(file_path, "rb") as file:
            while chunk := file.read(1024):
                yield chunk
    
    return StreamingResponse(iterfile(), media_type="audio/wav")

@router.get("/tts-generations", response_model=List[TTSGenerationWithScript])
def get_tts_generations(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
    status: Optional[GenerationStatus] = None,
    voice_actor_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> List[TTSGenerationWithScript]:
    """TTS 생성 목록 조회 (스크립트 정보 포함)"""
    # 스크립트와 성우 정보를 함께 조회
    statement = (
        select(
            TTSGeneration,
            TTSScript,
            VoiceActor.name.label("voice_actor_name")
        )
        .join(TTSScript, TTSGeneration.script_id == TTSScript.id)
        .outerjoin(VoiceActor, TTSScript.voice_actor_id == VoiceActor.id)
        .where(TTSGeneration.requested_by == current_user.id)
    )
    
    # 필터 적용
    if status:
        statement = statement.where(TTSGeneration.status == status)
    
    if voice_actor_id:
        statement = statement.where(TTSScript.voice_actor_id == voice_actor_id)
    
    if search:
        search_term = f"%{search}%"
        statement = statement.where(TTSScript.text_content.ilike(search_term))
    
    # 정렬
    if sort_by == "created_at":
        order_column = TTSGeneration.created_at
    elif sort_by == "quality_score":
        order_column = TTSGeneration.quality_score
    elif sort_by == "duration":
        order_column = TTSGeneration.duration
    else:
        order_column = TTSGeneration.created_at
    
    if sort_order == "desc":
        order_column = order_column.desc()
    else:
        order_column = order_column.asc()
    
    statement = statement.order_by(order_column).offset(skip).limit(limit)
    
    results = session.exec(statement).all()
    
    # 결과를 TTSGenerationWithScript 형태로 변환
    generations = []
    for generation, script, voice_actor_name in results:
        generation_dict = generation.model_dump()
        generation_dict["script"] = script.model_dump() if script else None
        generation_dict["voice_actor_name"] = voice_actor_name
        generations.append(TTSGenerationWithScript(**generation_dict))
    
    return generations

@router.get("/tts-generations/batch-status")
def get_batch_generation_status(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    generation_ids: str = None  # 쉽표로 구분된 생성 ID 목록
):
    """배치 TTS 생성 상태 조회"""
    if not generation_ids:
        raise HTTPException(status_code=400, detail="생성 ID가 필요합니다.")
    
    try:
        id_list = [uuid.UUID(id.strip()) for id in generation_ids.split(",")]
    except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 ID 형식입니다.")
    
    generations = []
    for gen_id in id_list:
        generation = session.get(TTSGeneration, gen_id)
        if generation and generation.requested_by == current_user.id:
            generations.append(generation)
    
    # 상태 요약
    status_summary = {
        "total": len(generations),
        "pending": len([g for g in generations if g.status == GenerationStatus.PENDING]),
        "processing": len([g for g in generations if g.status == GenerationStatus.PROCESSING]),
        "completed": len([g for g in generations if g.status == GenerationStatus.COMPLETED]),
        "failed": len([g for g in generations if g.status == GenerationStatus.FAILED]),
        "cancelled": len([g for g in generations if g.status == GenerationStatus.CANCELLED])
    }
    
    return {
        "generations": [TTSGenerationPublic.model_validate(g) for g in generations],
        "summary": status_summary
    }

@router.delete("/tts-generations/{generation_id}")
async def cancel_tts_generation(
    *,
    session: SessionDep,
    generation_id: uuid.UUID,
    current_user: CurrentUser
):
    """TTS 생성 취소 (팩토리 패턴 사용)"""
    generation = session.get(TTSGeneration, generation_id)
    if not generation:
        raise HTTPException(status_code=404, detail="생성 작업을 찾을 수 없습니다.")
    
    if generation.requested_by != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    
    # 🔄 팩토리에서 현재 TTS 서비스 가져오기
    tts_service = get_tts_service()
    
    success = await tts_service.cancel_generation(generation_id)
    if success:
        return {"message": "TTS 생성이 취소되었습니다."}
    else:
        raise HTTPException(status_code=400, detail="취소할 수 없는 상태입니다.")

# === TTS 라이브러리 관리 ===

@router.post("/tts-library", response_model=TTSLibraryPublic)
def create_tts_library(
    *,
    session: SessionDep,
    library_in: TTSLibraryCreate,
    current_user: CurrentUser
) -> TTSLibrary:
    """TTS 라이브러리 아이템 생성"""
    # 성우 존재 확인
    if library_in.voice_actor_id:
        voice_actor = session.get(VoiceActor, library_in.voice_actor_id)
        if not voice_actor:
            raise HTTPException(status_code=404, detail="성우를 찾을 수 없습니다.")
    
    library_item = TTSLibrary(
        **library_in.model_dump(),
        created_by=current_user.id
    )
    session.add(library_item)
    session.commit()
    session.refresh(library_item)
    return library_item

@router.get("/tts-library", response_model=List[TTSLibraryPublic])
def get_tts_library(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
    category: Optional[str] = None,
    is_public: Optional[bool] = None,
    search: Optional[str] = None
) -> List[TTSLibrary]:
    """TTS 라이브러리 목록 조회"""
    statement = select(TTSLibrary)
    
    # 필터 적용
    if category:
        statement = statement.where(TTSLibrary.category == category)
    if is_public is not None:
        statement = statement.where(TTSLibrary.is_public == is_public)
    if search:
        search_term = f"%{search}%"
        statement = statement.where(
            (TTSLibrary.name.ilike(search_term)) |
            (TTSLibrary.text_content.ilike(search_term)) |
            (TTSLibrary.tags.ilike(search_term))
        )
    
    # 공개 아이템 또는 본인이 생성한 아이템만 조회
    statement = statement.where(
        (TTSLibrary.is_public == True) |
        (TTSLibrary.created_by == current_user.id)
    )
    
    statement = statement.offset(skip).limit(limit).order_by(TTSLibrary.usage_count.desc())
    library_items = session.exec(statement).all()
    return library_items

@router.get("/tts-library/{library_id}", response_model=TTSLibraryPublic)
def get_tts_library_item(
    *,
    session: SessionDep,
    library_id: uuid.UUID,
    current_user: CurrentUser
) -> TTSLibrary:
    """TTS 라이브러리 아이템 조회"""
    library_item = session.get(TTSLibrary, library_id)
    if not library_item:
        raise HTTPException(status_code=404, detail="라이브러리 아이템을 찾을 수 없습니다.")
    
    # 접근 권한 확인 (공개 아이템 또는 본인이 생성한 아이템)
    if not library_item.is_public and library_item.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    
    return library_item

@router.put("/tts-library/{library_id}", response_model=TTSLibraryPublic)
def update_tts_library_item(
    *,
    session: SessionDep,
    library_id: uuid.UUID,
    library_in: TTSLibraryUpdate,
    current_user: CurrentUser
) -> TTSLibrary:
    """TTS 라이브러리 아이템 수정"""
    library_item = session.get(TTSLibrary, library_id)
    if not library_item:
        raise HTTPException(status_code=404, detail="라이브러리 아이템을 찾을 수 없습니다.")
    
    # 수정 권한 확인 (본인이 생성한 아이템만)
    if library_item.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    
    update_data = library_in.model_dump(exclude_unset=True)
    library_item.sqlmodel_update(update_data)
    
    session.add(library_item)
    session.commit()
    session.refresh(library_item)
    return library_item

@router.delete("/tts-library/{library_id}")
def delete_tts_library_item(
    *,
    session: SessionDep,
    library_id: uuid.UUID,
    current_user: CurrentUser
):
    """TTS 라이브러리 아이템 삭제"""
    library_item = session.get(TTSLibrary, library_id)
    if not library_item:
        raise HTTPException(status_code=404, detail="라이브러리 아이템을 찾을 수 없습니다.")
    
    # 삭제 권한 확인 (본인이 생성한 아이템만)
    if library_item.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    
    session.delete(library_item)
    session.commit()
    
    return {"message": "라이브러리 아이템이 삭제되었습니다."}

@router.post("/tts-library/{library_id}/use")
def use_tts_library_item(
    *,
    session: SessionDep,
    library_id: uuid.UUID,
    current_user: CurrentUser
):
    """TTS 라이브러리 아이템 사용 (사용 횟수 증가)"""
    library_item = session.get(TTSLibrary, library_id)
    if not library_item:
        raise HTTPException(status_code=404, detail="라이브러리 아이템을 찾을 수 없습니다.")
    
    # 접근 권한 확인
    if not library_item.is_public and library_item.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    
    # 사용 횟수 증가
    library_item.usage_count += 1
    session.add(library_item)
    session.commit()
    
    return {"message": "사용 횟수가 증가되었습니다.", "usage_count": library_item.usage_count}

@router.get("/tts-library/{library_id}/audio")
def stream_library_audio(
    *,
    session: SessionDep,
    library_id: uuid.UUID,
    current_user: CurrentUser
) -> StreamingResponse:
    """TTS 라이브러리 오디오 스트리밍"""
    library_item = session.get(TTSLibrary, library_id)
    if not library_item:
        raise HTTPException(status_code=404, detail="라이브러리 아이템을 찾을 수 없습니다.")
    
    # 접근 권한 확인
    if not library_item.is_public and library_item.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    
    if not library_item.audio_file_path:
        raise HTTPException(status_code=404, detail="오디오 파일이 없습니다.")
    
    file_path = Path(library_item.audio_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="오디오 파일을 찾을 수 없습니다.")
    
    def iterfile():
        with open(file_path, "rb") as file:
            while chunk := file.read(1024):
                yield chunk
    
    return StreamingResponse(iterfile(), media_type="audio/wav")

@router.get("/tts-library/categories", response_model=List[str])
def get_tts_library_categories(
    *,
    session: SessionDep,
    current_user: CurrentUser
) -> List[str]:
    """TTS 라이브러리 카테고리 목록 조회"""
    statement = select(TTSLibrary.category).distinct().where(
        TTSLibrary.category.isnot(None)
    )
    
    # 공개 아이템 또는 본인이 생성한 아이템만
    statement = statement.where(
        (TTSLibrary.is_public == True) |
        (TTSLibrary.created_by == current_user.id)
    )
    
    categories = session.exec(statement).all()
    return [cat for cat in categories if cat]  # None 값 제거

# === 디버깅 엔드포인트 ===

@router.get("/debug/diagnosis")
async def diagnose_tts_environment(
    *,
    current_user: CurrentUser
):
    """TTS 환경 전체 진단 (팩토리 패턴 사용)"""
    logger.info(f"TTS diagnosis requested by user {current_user.id}")
    
    try:
        # 🔄 팩토리에서 현재 TTS 서비스 가져오기
        tts_service = get_tts_service()
        
        # 기본 TTS 진단 수행
        await tts_service.initialize_tts_model()
        
        diagnosis = {
            "tts_mode": "Real TTS" if getattr(tts_service, 'tts_model', None) != "mock" else "Mock TTS",
            "model_loaded": getattr(tts_service, 'model_loaded', False),
            "gpu_enabled": getattr(tts_service, 'use_gpu', False),
            "status": "healthy"
        }
        
        return {
            "message": "TTS 환경 진단 완료",
            "diagnosis": diagnosis
        }
    except Exception as e:
        logger.error(f"TTS diagnosis failed: {e}")
        return {
            "message": "TTS 환경 진단 실패",
            "error": str(e),
            "error_type": type(e).__name__
        }

@router.post("/debug/fix-issues")
async def fix_common_tts_issues(
    *,
    current_user: CurrentUser
):
    """일반적인 TTS 문제들 자동 수정 (팩토리 패턴 사용)"""
    logger.info(f"TTS auto-fix requested by user {current_user.id}")
    
    try:
        # 기본 문제 수정 수행
        results = {
            "directories_created": 0,
            "permissions_fixed": 0,
            "tts_model_reloaded": False
        }
        
        # 디렉토리 생성 확인
        from pathlib import Path
        audio_dir = Path("audio_files")
        voice_dir = Path("voice_samples")
        
        if not audio_dir.exists():
            audio_dir.mkdir(parents=True, exist_ok=True)
            results["directories_created"] += 1
            
        if not voice_dir.exists():
            voice_dir.mkdir(parents=True, exist_ok=True)
            results["directories_created"] += 1
        
        # 🔄 팩토리에서 현재 TTS 서비스 가져오기
        tts_service = get_tts_service()
        
        # TTS 모델 재로드
        try:
            await tts_service.initialize_tts_model()
            results["tts_model_reloaded"] = True
        except Exception as e:
            logger.warning(f"TTS model reload failed: {e}")
        
        return {
            "message": "TTS 문제 자동 수정 완료",
            "results": results
        }
    except Exception as e:
        logger.error(f"TTS auto-fix failed: {e}")
        return {
            "message": "TTS 문제 자동 수정 실패",
            "error": str(e)
        }

@router.post("/test-tts")
async def test_tts_functionality(
    *,
    current_user: CurrentUser
):
    """TTS 기능 테스트 엔드포인트 (팩토리 패턴 사용)"""
    logger.info(f"🧪 TTS functionality test requested by user {current_user.id}")
    
    try:
        # 🔄 팩토리에서 현재 TTS 서비스 가져오기
        tts_service = get_tts_service()
        
        # TTS 서비스 기능 테스트
        test_result = await tts_service.test_tts_functionality()
        
        return {
            "message": "TTS 기능 테스트 완료",
            "timestamp": datetime.now().isoformat(),
            "test_result": test_result,
            "status": "success" if test_result.get("success") else "failed"
        }
        
    except Exception as e:
        logger.error(f"❌ TTS functionality test failed: {e}")
        return {
            "message": "TTS 기능 테스트 실패",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "error_type": type(e).__name__,
            "status": "error"
        }

@router.post("/generate-test-tts")
async def generate_test_tts(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    test_text: str = "안녕하세요. 이것은 TTS 테스트 음성입니다. 개선된 음성 품질을 확인해보세요.",
    voice_actor_id: Optional[uuid.UUID] = None
):
    """테스트용 TTS 생성 (팩토리 패턴 사용)"""
    logger.info(f"🎙️ Test TTS generation requested by user {current_user.id}")
    logger.info(f"Text: '{test_text[:50]}...'")
    
    try:
        # 테스트 TTS 스크립트 생성
        test_script = TTSScript(
            text_content=test_text,
            voice_actor_id=voice_actor_id,
            voice_settings={
                "speed": 1.0,
                "tone": "friendly",
                "emotion": "bright",
                "test_mode": True
            },
            created_by=current_user.id
        )
        
        session.add(test_script)
        session.commit()
        session.refresh(test_script)
        
        # TTS 생성 작업 생성
        test_generation = TTSGeneration(
            script_id=test_script.id,
            generation_params={
                "quality": "high",
                "test_mode": True,
                "priority": "high"
            },
            requested_by=current_user.id
        )
        
        session.add(test_generation)
        session.commit()
        session.refresh(test_generation)
        
        # 🔄 팩토리에서 현재 TTS 서비스 가져오기
        tts_service = get_tts_service()
        
        # 백그라운드에서 즉시 처리
        background_tasks.add_task(
            tts_service.process_tts_generation,
            test_generation.id
        )
        
        # 성우 정보 추가
        voice_actor_name = None
        if voice_actor_id:
            voice_actor = session.get(VoiceActor, voice_actor_id)
            if voice_actor:
                voice_actor_name = voice_actor.name
        
        return {
            "message": "테스트 TTS 생성이 시작되었습니다",
            "timestamp": datetime.now().isoformat(),
            "script_id": str(test_script.id),
            "generation_id": str(test_generation.id),
            "text_content": test_text,
            "voice_actor_name": voice_actor_name,
            "estimated_time": "30-60초",
            "status": "pending"
        }
        
    except Exception as e:
        logger.error(f"❌ Test TTS generation failed: {e}")
        return {
            "message": "테스트 TTS 생성 실패",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "error_type": type(e).__name__,
            "status": "error"
        }

@router.get("/tts-status")
async def get_tts_service_status(
    *,
    current_user: CurrentUser
):
    """TTS 서비스 상태 조회 (팩토리 패턴 사용)"""
    logger.info(f"📊 TTS service status requested by user {current_user.id}")
    
    try:
        # 🔄 팩토리에서 현재 TTS 서비스 가져오기
        tts_service = get_tts_service()
        
        # TTS 모델 초기화 상태 확인
        await tts_service.initialize_tts_model()
        
        # 디렉토리 상태 확인
        audio_files_dir = Path("audio_files")
        voice_samples_dir = Path("voice_samples")
        
        audio_files_count = len(list(audio_files_dir.glob("*.wav"))) if audio_files_dir.exists() else 0
        voice_samples_count = len(list(voice_samples_dir.rglob("*.wav"))) if voice_samples_dir.exists() else 0
        
        # TTS 모델 상태
        tts_mode = "Real TTS" if getattr(tts_service, 'tts_model', None) != "mock" else "Mock TTS"
        model_status = "loaded" if getattr(tts_service, 'model_loaded', False) else "not_loaded"
        
        # GPU 상태 확인
        gpu_status = "unavailable"
        try:
            import torch
            if torch.cuda.is_available():
                gpu_status = f"available ({torch.cuda.device_count()} devices)"
            else:
                gpu_status = "cuda_unavailable"
        except ImportError:
            gpu_status = "torch_not_installed"
        
        return {
            "timestamp": datetime.now().isoformat(),
            "service_status": "healthy",
            "tts_mode": tts_mode,
            "model_status": model_status,
            "gpu_status": gpu_status,
            "gpu_enabled": getattr(tts_service, 'use_gpu', False),
            "directories": {
                "audio_files": {
                    "path": str(audio_files_dir),
                    "exists": audio_files_dir.exists(),
                    "files_count": audio_files_count
                },
                "voice_samples": {
                    "path": str(voice_samples_dir),
                    "exists": voice_samples_dir.exists(),
                    "files_count": voice_samples_count
                }
            },
            "recommendations": [
                "🎙️ 실제 음성을 원하면 Coqui TTS 라이브러리를 설치하세요" if tts_mode == "Mock TTS" else "✅ 실제 TTS 모델이 활성화되어 있습니다",
                "⚡ GPU 가속을 위해 CUDA를 설치하세요" if gpu_status == "cuda_unavailable" else "✅ GPU 가속이 사용 가능합니다" if "available" in gpu_status else "ℹ️ CPU 모드로 동작 중입니다"
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ TTS service status check failed: {e}")
        return {
            "timestamp": datetime.now().isoformat(),
            "service_status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }

# === 성우 관리 (path parameter를 포함한 경로는 마지막에 정의) ===

@router.post("/", response_model=VoiceActorPublic)
def create_voice_actor(
    *,
    session: SessionDep,
    voice_actor_in: VoiceActorCreate,
    current_user: CurrentUser
) -> VoiceActorPublic:
    """새 성우 등록"""
    voice_actor = VoiceActor(
        **voice_actor_in.model_dump(),
        created_by=current_user.id
    )
    session.add(voice_actor)
    session.commit()
    session.refresh(voice_actor)
    
    try:
        return VoiceActorPublic.model_validate(voice_actor)
    except Exception as e:
        logger.error(f"❌ Failed to convert new voice actor {voice_actor.id}: {e}")
        raise HTTPException(status_code=500, detail="성우 데이터 변환 중 오류가 발생했습니다.")

@router.get("/", response_model=List[VoiceActorPublic])
def get_voice_actors(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
    gender: Optional[GenderType] = None,
    age_range: Optional[AgeRangeType] = None,
    language: Optional[str] = None,
    is_active: Optional[bool] = None
) -> List[VoiceActorPublic]:
    """성우 목록 조회"""
    logger.info(f"🎯 GET /voice-actors called with filters: gender={gender}, age_range={age_range}, language={language}, is_active={is_active}")
    
    try:
        statement = select(VoiceActor)
        
        # 필터 적용
        if gender:
            statement = statement.where(VoiceActor.gender == gender)
        if age_range:
            statement = statement.where(VoiceActor.age_range == age_range)
        if language:
            statement = statement.where(VoiceActor.language == language)
        if is_active is not None:
            statement = statement.where(VoiceActor.is_active == is_active)
        
        statement = statement.offset(skip).limit(limit)
        voice_actors = session.exec(statement).all()
        
        logger.info(f"📊 Found {len(voice_actors)} voice actors")
        
        # VoiceActor 객체들을 VoiceActorPublic으로 변환
        public_actors = []
        for actor in voice_actors:
            try:
                public_actor = VoiceActorPublic.model_validate(actor)
                public_actors.append(public_actor)
            except Exception as e:
                logger.error(f"❌ Failed to convert voice actor {actor.id}: {e}")
                continue
        
        logger.info(f"✅ Successfully converted {len(public_actors)} out of {len(voice_actors)} voice actors")
        return public_actors
        
    except Exception as e:
        logger.error(f"💥 ERROR in get_voice_actors: {e}")
        raise HTTPException(status_code=500, detail=f"성우 목록 조회 중 오류: {str(e)}")

# path parameter를 가진 경로들은 마지막에 정의
@router.get("/{voice_actor_id}", response_model=VoiceActorPublic)
def get_voice_actor(
    *,
    session: SessionDep,
    voice_actor_id: uuid.UUID,
    current_user: CurrentUser
) -> VoiceActorPublic:
    """특정 성우 조회"""
    voice_actor = session.get(VoiceActor, voice_actor_id)
    if not voice_actor:
        raise HTTPException(status_code=404, detail="성우를 찾을 수 없습니다.")
    
    try:
        return VoiceActorPublic.model_validate(voice_actor)
    except Exception as e:
        logger.error(f"❌ Failed to convert voice actor {voice_actor_id}: {e}")
        raise HTTPException(status_code=500, detail="성우 데이터 변환 중 오류가 발생했습니다.")

@router.put("/{voice_actor_id}", response_model=VoiceActorPublic)
def update_voice_actor(
    *,
    session: SessionDep,
    voice_actor_id: uuid.UUID,
    voice_actor_in: VoiceActorUpdate,
    current_user: CurrentUser
) -> VoiceActorPublic:
    """성우 정보 수정"""
    voice_actor = session.get(VoiceActor, voice_actor_id)
    if not voice_actor:
        raise HTTPException(status_code=404, detail="성우를 찾을 수 없습니다.")
    
    update_data = voice_actor_in.model_dump(exclude_unset=True)
    voice_actor.sqlmodel_update(update_data)
    
    session.add(voice_actor)
    session.commit()
    session.refresh(voice_actor)
    
    try:
        return VoiceActorPublic.model_validate(voice_actor)
    except Exception as e:
        logger.error(f"❌ Failed to convert updated voice actor {voice_actor_id}: {e}")
        raise HTTPException(status_code=500, detail="성우 데이터 변환 중 오류가 발생했습니다.")

@router.delete("/{voice_actor_id}")
def delete_voice_actor(
    *,
    session: SessionDep,
    voice_actor_id: uuid.UUID,
    current_user: CurrentUser
):
    """성우 삭제 (비활성화)"""
    voice_actor = session.get(VoiceActor, voice_actor_id)
    if not voice_actor:
        raise HTTPException(status_code=404, detail="성우를 찾을 수 없습니다.")
    
    voice_actor.is_active = False
    session.add(voice_actor)
    session.commit()
    
    return {"message": "성우가 비활성화되었습니다."}

@router.post("/{voice_actor_id}/samples", response_model=VoiceSamplePublic)
async def upload_voice_sample(
    *,
    session: SessionDep,
    voice_actor_id: uuid.UUID,
    current_user: CurrentUser,
    audio_file: UploadFile = File(...),
    text_content: str = Form(...)
) -> VoiceSamplePublic:
    """음성 샘플 업로드"""
    # 성우 존재 확인
    voice_actor = session.get(VoiceActor, voice_actor_id)
    if not voice_actor:
        raise HTTPException(status_code=404, detail="성우를 찾을 수 없습니다.")
    
    # 파일 검증
    if not audio_file.content_type or not audio_file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="오디오 파일만 업로드 가능합니다.")
    
    # 파일 저장
    samples_dir = Path("voice_samples") / str(voice_actor_id)
    samples_dir.mkdir(parents=True, exist_ok=True)
    
    file_extension = Path(audio_file.filename or "sample.wav").suffix or ".wav"
    filename = f"sample_{uuid.uuid4().hex[:8]}{file_extension}"
    file_path = samples_dir / filename
    
    # 파일 저장
    with open(file_path, "wb") as buffer:
        content = await audio_file.read()
        buffer.write(content)
    
    # 데이터베이스에 정보 저장
    voice_sample = VoiceSample(
        voice_actor_id=voice_actor_id,
        text_content=text_content,
        audio_file_path=str(file_path),
        file_size=len(content),
        uploaded_by=current_user.id
    )
    
    session.add(voice_sample)
    session.commit()
    session.refresh(voice_sample)
    
    try:
        return VoiceSamplePublic.model_validate(voice_sample)
    except Exception as e:
        logger.error(f"❌ Failed to convert uploaded voice sample {voice_sample.id}: {e}")
        raise HTTPException(status_code=500, detail="음성 샘플 데이터 변환 중 오류가 발생했습니다.")

@router.get("/{voice_actor_id}/samples", response_model=List[VoiceSamplePublic])
def get_voice_samples(
    *,
    session: SessionDep,
    voice_actor_id: uuid.UUID,
    current_user: CurrentUser
) -> List[VoiceSamplePublic]:
    """성우 음성 샘플 목록"""
    logger.info(f"🎯 GET /voice-actors/{voice_actor_id}/samples called")
    
    try:
        statement = select(VoiceSample).where(VoiceSample.voice_actor_id == voice_actor_id)
        samples = session.exec(statement).all()
        
        logger.info(f"📊 Found {len(samples)} voice samples")
        
        # VoiceSample 객체들을 VoiceSamplePublic으로 변환
        public_samples = []
        for sample in samples:
            try:
                public_sample = VoiceSamplePublic.model_validate(sample)
                public_samples.append(public_sample)
            except Exception as e:
                logger.error(f"❌ Failed to convert voice sample {sample.id}: {e}")
                continue
        
        logger.info(f"✅ Successfully converted {len(public_samples)} out of {len(samples)} voice samples")
        return public_samples
        
    except Exception as e:
        logger.error(f"💥 ERROR in get_voice_samples: {e}")
        raise HTTPException(status_code=500, detail=f"음성 샘플 목록 조회 중 오류: {str(e)}")

@router.get("/{voice_actor_id}/samples/{sample_id}/audio")
def stream_voice_sample(
    *,
    session: SessionDep,
    voice_actor_id: uuid.UUID,
    sample_id: uuid.UUID,
    current_user: CurrentUser
) -> StreamingResponse:
    """음성 샘플 스트리밍"""
    sample = session.get(VoiceSample, sample_id)
    if not sample or sample.voice_actor_id != voice_actor_id:
        raise HTTPException(status_code=404, detail="음성 샘플을 찾을 수 없습니다.")
    
    file_path = Path(sample.audio_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="오디오 파일을 찾을 수 없습니다.")
    
    def iterfile():
        with open(file_path, "rb") as file:
            while chunk := file.read(1024):
                yield chunk
    
    return StreamingResponse(iterfile(), media_type="audio/wav")

# === 배치 TTS 생성 클래스 ===

class BatchTTSRequest(SQLModel):
    script_ids: List[uuid.UUID]
    force_regenerate: bool = False
