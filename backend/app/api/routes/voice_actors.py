import uuid
from typing import List, Optional
from pathlib import Path

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
    TTSLibrary, TTSLibraryCreate, TTSLibraryUpdate, TTSLibraryPublic
)
from app.services.tts_service import tts_service

router = APIRouter(prefix="/voice-actors", tags=["voice-actors"])

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
