import uuid
from typing import Any, List

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.models.ment import Ment, MentCreate, MentUpdate
from app.crud import ment as crud

router = APIRouter(prefix="/ments", tags=["ments"])


@router.post("/", response_model=Ment)
def create_ment(
    *, session: SessionDep, ment_in: MentCreate, current_user: CurrentUser
) -> Any:
    """
    Create new ment.
    """
    ment_in.file_path = "/tmp/file_path_test"
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


@router.get("/", response_model=List[Ment])
def read_ments(
    *, session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 5
) -> Any:
    """
    Retrieve ments created by the current user.
    """
    ments = crud.get_ments_by_user_id(session=session, user_id=current_user.id, skip=skip, limit=limit)
    return ments
