import uuid
from typing import Any, List

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser, SessionDep
from app.models.ment import Ment, MentCreate, MentUpdate, MentPublic
from app.crud import ment as crud

router = APIRouter(prefix="/ments", tags=["ments"])


@router.post("/", response_model=MentPublic)
def create_ment(
    *, session: SessionDep, ment_in: MentCreate, current_user: CurrentUser
) -> Any:
    """
    Create new ment.
    """
    ment = crud.create_ment(session=session, ment_in=ment_in, user_id=current_user.id)
    return ment


@router.patch("/{ment_id}", response_model=Ment)
def update_ment(
    *, session: SessionDep, ment_id: uuid.UUID, ment_in: MentUpdate, current_user: CurrentUser
) -> Any:
    """
    Update a ment.
    """
    ment = crud.get_ment_by_id(session=session, ment_id=ment_id)
    if not ment or ment.user_id != current_user.id:
        raise HTTPException(
            status_code=404, detail="The ment with this id does not exist or you do not have permission to update it"
        )
    ment = crud.update_ment(session=session, ment=ment, ment_in=ment_in)
    return ment


@router.delete("/{ment_id}", response_model=Ment)
def delete_ment(
    *, session: SessionDep, ment_id: uuid.UUID, current_user: CurrentUser
) -> Any:
    """
    Delete a ment.
    """
    ment = crud.get_ment_by_id(session=session, ment_id=ment_id)
    if not ment or ment.user_id != current_user.id:
        raise HTTPException(
            status_code=404, detail="The ment with this id does not exist or you do not have permission to delete it"
        )
    ment = crud.delete_ment(session=session, ment=ment)
    return ment


@router.get("/", response_model=List[MentPublic])
def read_ments(
    *, session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 10
) -> Any:
    """
    Retrieve ments created by the current user.
    """
    ments = crud.get_ments_by_user_id(session=session, user_id=current_user.id, skip=skip, limit=limit)
    return ments


# ment 음성 파일 wav 파일을 스트리밍으로 반환하는 엔드포인트
@router.get("/{ment_id}/audio", response_class=StreamingResponse)
def get_ment_audio(
    ment_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> StreamingResponse:
    """
    Retrieve the audio file for a ment.
    """
    ment = crud.get_ment_by_id(session=session, ment_id=ment_id)
    if not ment or ment.user_id != current_user.id:
        raise HTTPException(
            status_code=404, detail="The ment with this id does not exist or you do not have permission to access it"
        )

    # 해당 파일이 파일 경로에 있는지 체크 없다면 없다는 에러를 반환 파일을 찾아서 재생할 수 있다면 성공이라는 문구 출력
    # 예를 들어 ment.file_path가 "/path/to/audio.wav"라면, 해당 경로에 파일이 존재하는지 확인합니다.
    # pathlib.Path를 사용하여 파일 경로를 확인합니다.
    from pathlib import Path
    # file_path = Path(base_path) / Path(ment.file_path)
    file_path = Path(ment.file_path)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    # 파일 스트리밍을 위한 제너레이터 함수 정의
    def iterfile():
        with open(file_path, "rb") as file:
            while chunk := file.read(1024):
                yield chunk

    # 파일이 존재한다면 스트리밍으로 반환
    # StreamingResponse는 파일을 스트리밍으로 반환하는 FastAPI의 클래스입니다.
    # media_type은 반환할 파일의 MIME 타입을 지정합니다. wav 파일이므로 "audio/wav"로 설정합니다.
    return StreamingResponse(iterfile(), media_type="audio/wav")
