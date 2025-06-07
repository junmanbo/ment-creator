import uuid
import logging
from datetime import datetime
from typing import List, Optional
from pathlib import Path
from sqlmodel import SQLModel

logger = logging.getLogger(__name__)

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.voice_actor import (
    VoiceActor, VoiceActorCreate, VoiceActorUpdate, VoiceActorPublic,
    VoiceModel, VoiceModelCreate, VoiceModelUpdate, VoiceModelPublic,
    VoiceSample, VoiceSampleCreate, VoiceSamplePublic,
    GenderType, AgeRangeType, ModelStatus
)
from app.models.tts import (
    TTSScript, TTSScriptCreate, TTSScriptPublic, 
    TTSGeneration, TTSGenerateRequest, TTSGenerationPublic,
    TTSLibrary, TTSLibraryCreate, TTSLibraryUpdate, TTSLibraryPublic,
    GenerationStatus
)

from app.services.tts_service import tts_service

# TTS Generation with Script info
class TTSGenerationWithScript(TTSGenerationPublic):
    script: Optional[TTSScriptPublic] = None
    voice_actor_name: Optional[str] = None

router = APIRouter(prefix="/voice-actors", tags=["voice-actors"])

# 테스트 엔드포인트
@router.get("/test")
def test_voice_actors_api():
    """API 테스트 엔드포인트"""
    return {"message": "Voice actors API is working", "timestamp": datetime.now().isoformat()}

# === 성우 관리 ===

@router.post("/", response_model=VoiceActorPublic)
def create_voice_actor(
    *,
    session: SessionDep,
    voice_actor_in: VoiceActorCreate,
    current_user: CurrentUser
) -> VoiceActor:
    """새 성우 등록"""
    voice_actor = VoiceActor(
        **voice_actor_in.model_dump(),
        created_by=current_user.id
    )
    session.add(voice_actor)
    session.commit()
    session.refresh(voice_actor)
    return voice_actor

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
) -> List[VoiceActor]:
    """성우 목록 조회"""
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
    return voice_actors

@router.get("/{voice_actor_id}", response_model=VoiceActorPublic)
def get_voice_actor(
    *,
    session: SessionDep,
    voice_actor_id: uuid.UUID,
    current_user: CurrentUser
) -> VoiceActor:
    """특정 성우 조회"""
    voice_actor = session.get(VoiceActor, voice_actor_id)
    if not voice_actor:
        raise HTTPException(status_code=404, detail="성우를 찾을 수 없습니다.")
    return voice_actor

@router.put("/{voice_actor_id}", response_model=VoiceActorPublic)
def update_voice_actor(
    *,
    session: SessionDep,
    voice_actor_id: uuid.UUID,
    voice_actor_in: VoiceActorUpdate,
    current_user: CurrentUser
) -> VoiceActor:
    """성우 정보 수정"""
    voice_actor = session.get(VoiceActor, voice_actor_id)
    if not voice_actor:
        raise HTTPException(status_code=404, detail="성우를 찾을 수 없습니다.")
    
    update_data = voice_actor_in.model_dump(exclude_unset=True)
    voice_actor.sqlmodel_update(update_data)
    
    session.add(voice_actor)
    session.commit()
    session.refresh(voice_actor)
    return voice_actor

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

# === 음성 샘플 관리 ===

@router.post("/{voice_actor_id}/samples", response_model=VoiceSamplePublic)
async def upload_voice_sample(
    *,
    session: SessionDep,
    voice_actor_id: uuid.UUID,
    current_user: CurrentUser,
    audio_file: UploadFile = File(...),
    text_content: str = Form(...)
):
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
    
    return voice_sample

@router.get("/{voice_actor_id}/samples", response_model=List[VoiceSamplePublic])
def get_voice_samples(
    *,
    session: SessionDep,
    voice_actor_id: uuid.UUID,
    current_user: CurrentUser
) -> List[VoiceSample]:
    """성우 음성 샘플 목록"""
    statement = select(VoiceSample).where(VoiceSample.voice_actor_id == voice_actor_id)
    samples = session.exec(statement).all()
    return samples

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

# === TTS 스크립트 및 생성 ===

@router.post("/tts-scripts", response_model=TTSScriptPublic)
def create_tts_script(
    *,
    session: SessionDep,
    script_in: TTSScriptCreate,
    current_user: CurrentUser
) -> TTSScript:
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
    return script

@router.post("/tts-scripts/{script_id}/generate", response_model=TTSGenerationPublic)
async def generate_tts(
    *,
    session: SessionDep,
    script_id: uuid.UUID,
    generate_request: TTSGenerateRequest,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks
) -> TTSGeneration:
    """TTS 생성 요청"""
    # 스크립트 확인
    script = session.get(TTSScript, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="스크립트를 찾을 수 없습니다.")
    
    # 생성 작업 생성
    generation = TTSGeneration(
        script_id=script_id,
        voice_model_id=generate_request.voice_model_id,
        generation_params=generate_request.generation_params,
        requested_by=current_user.id
    )
    
    session.add(generation)
    session.commit()
    session.refresh(generation)
    
    # 백그라운드에서 TTS 생성 처리
    background_tasks.add_task(
        tts_service.process_tts_generation,
        generation.id
    )
    
    return generation

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

@router.delete("/tts-generations/{generation_id}")
async def cancel_tts_generation(
    *,
    session: SessionDep,
    generation_id: uuid.UUID,
    current_user: CurrentUser
):
    """TTS 생성 취소"""
    generation = session.get(TTSGeneration, generation_id)
    if not generation:
        raise HTTPException(status_code=404, detail="생성 작업을 찾을 수 없습니다.")
    
    if generation.requested_by != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    
    success = await tts_service.cancel_generation(generation_id)
    if success:
        return {"message": "TTS 생성이 취소되었습니다."}
    else:
        raise HTTPException(status_code=400, detail="취소할 수 없는 상태입니다.")

# === 배치 TTS 생성 ===

class BatchTTSRequest(SQLModel):
    script_ids: List[uuid.UUID]
    force_regenerate: bool = False

@router.post("/tts-scripts/batch-generate")
async def batch_generate_tts(
    *,
    session: SessionDep,
    batch_request: BatchTTSRequest,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks
):
    """여러 TTS 스크립트를 한 번에 생성"""
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

# === 음성 모델 관리 ===

@router.get("/models/debug")
def debug_voice_models_api(*, current_user: CurrentUser, session: SessionDep):
    """모델 API 디버깅 엔드포인트"""
    logger.info("Debug voice models API called")
    
    try:
        # 1. 기본 정보 반환
        result = {
            "message": "Voice models debug API is working",
            "timestamp": datetime.now().isoformat(),
            "user_id": str(current_user.id)
        }
        
        # 2. 데이터베이스 연결 테스트
        try:
            count_result = session.exec(select(VoiceModel))
            models = count_result.all()
            result["voice_models_count"] = len(models)
            result["voice_models"] = [
                {
                    "id": str(model.id),
                    "model_name": model.model_name,
                    "status": model.status,
                    "voice_actor_id": str(model.voice_actor_id)
                } for model in models[:3]  # 처음 3개만
            ]
        except Exception as db_error:
            result["database_error"] = str(db_error)
            result["voice_models_count"] = -1
        
        # 3. 성우 개수 확인
        try:
            actors_result = session.exec(select(VoiceActor))
            actors = actors_result.all()
            result["voice_actors_count"] = len(actors)
        except Exception as actors_error:
            result["voice_actors_error"] = str(actors_error)
            result["voice_actors_count"] = -1
            
        return result
        
    except Exception as e:
        logger.error(f"Debug API error: {e}")
        return {
            "message": "Debug API error",
            "error": str(e),
            "error_type": str(type(e))
        }

@router.post("/models", response_model=VoiceModelPublic)
def create_voice_model(
    *,
    session: SessionDep,
    model_in: VoiceModelCreate,
    current_user: CurrentUser
) -> VoiceModel:
    """새 음성 모델 생성"""
    logger.info(f"Creating voice model: {model_in.model_dump()}")
    
    # 성우 존재 확인
    voice_actor = session.get(VoiceActor, model_in.voice_actor_id)
    if not voice_actor:
        logger.error(f"Voice actor {model_in.voice_actor_id} not found")
        raise HTTPException(status_code=404, detail="성우를 찾을 수 없습니다.")
    
    logger.info(f"Found voice actor: {voice_actor.name}")
    
    # 모델 경로 생성
    model_dir = Path("voice_models") / str(model_in.voice_actor_id)
    model_dir.mkdir(parents=True, exist_ok=True)
    
    model_filename = f"{model_in.model_name.replace(' ', '_')}_{uuid.uuid4().hex[:8]}.pth"
    model_path = model_dir / model_filename
    
    logger.info(f"Model will be saved to: {model_path}")
    
    try:
        voice_model = VoiceModel(
            **model_in.model_dump(exclude={"voice_actor_id"}),
            voice_actor_id=model_in.voice_actor_id,
            model_path=str(model_path)
        )
        
        session.add(voice_model)
        session.commit()
        session.refresh(voice_model)
        
        logger.info(f"Voice model created successfully: {voice_model.id}")
        return voice_model
        
    except Exception as e:
        logger.error(f"Failed to create voice model: {e}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"모델 생성 중 오류 발생: {str(e)}")

@router.post("/{voice_actor_id}/models", response_model=VoiceModelPublic)
def create_voice_model_legacy(
    *,
    session: SessionDep,
    voice_actor_id: uuid.UUID,
    model_in: VoiceModelCreate,
    current_user: CurrentUser
) -> VoiceModel:
    """새 음성 모델 생성 (Legacy 경로 - deprecated)"""
    logger.warning(f"Using deprecated voice model creation endpoint: /voice-actors/{voice_actor_id}/models")
    logger.warning("Please use /voice-actors/models instead")
    
    # voice_actor_id를 model_in에 설정
    model_in.voice_actor_id = voice_actor_id
    
    # 기존 create_voice_model 함수 호출
    return create_voice_model(
        session=session,
        model_in=model_in,
        current_user=current_user
    )

@router.get("/models", response_model=List[VoiceModelPublic])
def get_voice_models(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
    voice_actor_id: Optional[uuid.UUID] = None,
    status: Optional[ModelStatus] = None
) -> List[VoiceModel]:
    """음성 모델 목록 조회"""
    logger.info(f"get_voice_models called with: skip={skip}, limit={limit}, voice_actor_id={voice_actor_id}, status={status}")
    
    try:
        statement = select(VoiceModel)
        
        # 필터 적용
        if voice_actor_id:
            logger.info(f"Filtering by voice_actor_id: {voice_actor_id}")
            statement = statement.where(VoiceModel.voice_actor_id == voice_actor_id)
        if status:
            logger.info(f"Filtering by status: {status}")
            statement = statement.where(VoiceModel.status == status)
        
        statement = statement.offset(skip).limit(limit).order_by(VoiceModel.created_at.desc())
        
        logger.info(f"Executing query: {statement}")
        voice_models = session.exec(statement).all()
        
        logger.info(f"Found {len(voice_models)} voice models")
        return voice_models
        
    except Exception as e:
        logger.error(f"Error in get_voice_models: {e}")
        logger.error(f"Error type: {type(e)}")
        raise HTTPException(status_code=500, detail=f"음성 모델 조회 중 오류: {str(e)}")

@router.get("/models/{model_id}", response_model=VoiceModelPublic)
def get_voice_model(
    *,
    session: SessionDep,
    model_id: uuid.UUID,
    current_user: CurrentUser
) -> VoiceModel:
    """특정 음성 모델 조회"""
    voice_model = session.get(VoiceModel, model_id)
    if not voice_model:
        raise HTTPException(status_code=404, detail="음성 모델을 찾을 수 없습니다.")
    return voice_model

@router.put("/models/{model_id}", response_model=VoiceModelPublic)
def update_voice_model(
    *,
    session: SessionDep,
    model_id: uuid.UUID,
    model_in: VoiceModelUpdate,
    current_user: CurrentUser
) -> VoiceModel:
    """음성 모델 정보 수정"""
    voice_model = session.get(VoiceModel, model_id)
    if not voice_model:
        raise HTTPException(status_code=404, detail="음성 모델을 찾을 수 없습니다.")
    
    update_data = model_in.model_dump(exclude_unset=True)
    voice_model.sqlmodel_update(update_data)
    voice_model.updated_at = datetime.now()
    
    session.add(voice_model)
    session.commit()
    session.refresh(voice_model)
    return voice_model

@router.delete("/models/{model_id}")
def delete_voice_model(
    *,
    session: SessionDep,
    model_id: uuid.UUID,
    current_user: CurrentUser
):
    """음성 모델 삭제"""
    voice_model = session.get(VoiceModel, model_id)
    if not voice_model:
        raise HTTPException(status_code=404, detail="음성 모델을 찾을 수 없습니다.")
    
    # 모델 파일 삭제
    model_file = Path(voice_model.model_path)
    if model_file.exists():
        try:
            model_file.unlink()
        except Exception as e:
            logger.warning(f"Failed to delete model file {model_file}: {e}")
    
    session.delete(voice_model)
    session.commit()
    
    return {"message": "음성 모델이 삭제되었습니다."}

@router.post("/models/{model_id}/train")
async def train_voice_model(
    *,
    session: SessionDep,
    model_id: uuid.UUID,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks
):
    """음성 모델 학습 시작"""
    voice_model = session.get(VoiceModel, model_id)
    if not voice_model:
        raise HTTPException(status_code=404, detail="음성 모델을 찾을 수 없습니다.")
    
    if voice_model.status == ModelStatus.TRAINING:
        raise HTTPException(status_code=400, detail="이미 학습 중인 모델입니다.")
    
    # 성우의 음성 샘플 확인
    samples_count = session.exec(
        select(VoiceSample).where(VoiceSample.voice_actor_id == voice_model.voice_actor_id)
    ).all()
    
    if len(samples_count) < 3:
        raise HTTPException(
            status_code=400, 
            detail="모델 학습을 위해서는 최소 3개의 음성 샘플이 필요합니다."
        )
    
    # 모델 상태를 학습 중으로 변경
    voice_model.status = ModelStatus.TRAINING
    voice_model.updated_at = datetime.now()
    session.add(voice_model)
    session.commit()
    
    # 백그라운드에서 모델 학습 시작 (실제 구현은 tts_service에서)
    background_tasks.add_task(
        tts_service.train_voice_model,
        model_id
    )
    
    return {
        "message": "음성 모델 학습이 시작되었습니다.",
        "model_id": model_id,
        "status": "training"
    }

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
