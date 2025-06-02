from typing import List, Optional
from uuid import UUID
from datetime import datetime

from sqlmodel import Session, select

from app.models.ment import Ment, MentCreate, MentUpdate


def create_ment(*, session: Session, ment_in: MentCreate, user_id: UUID) -> Ment:
    ment = Ment(
        title=ment_in.title,
        sub_title=ment_in.sub_title,
        content=ment_in.content,
        user_id=user_id,
        file_path=ment_in.file_path,
        created_dt=datetime.now(),
        modified_dt=datetime.now(),
    )
    session.add(ment)
    session.commit()
    session.refresh(ment)
    return ment


def update_ment(*, session: Session, ment: Ment, ment_in: MentUpdate) -> Ment:
    ment_data = ment_in.dict(exclude_unset=True)
    for key, value in ment_data.items():
        setattr(ment, key, value)
    ment.modified_dt = datetime.now()
    session.add(ment)
    session.commit()
    session.refresh(ment)
    return ment


def delete_ment(*, session: Session, ment: Ment) -> Ment:
    session.delete(ment)
    session.commit()
    return ment


def get_ment_by_id(*, session: Session, ment_id: UUID) -> Optional[Ment]:
    return session.get(Ment, ment_id)


def get_ments_by_user_id(*, session: Session, user_id: UUID, skip: int = 0, limit: int = 5) -> List[Ment]:
    statement = select(Ment).where(Ment.user_id == user_id).offset(skip).limit(limit)
    return session.exec(statement).all()
