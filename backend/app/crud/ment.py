from typing import List, Optional
from uuid import UUID
from datetime import datetime

from sqlmodel import Session, select

from app.models.ment import Ment, MentCreate, MentUpdate, MentPublic


def create_ment(*, session: Session, ment_in: MentCreate, user_id: UUID) -> Ment:
    now = datetime.now()

    # 멘트 파일 생성 알고리즘 추가 후 파일 명 붙여 주기

    # 현재 시간을 타임스탬프로 넣고 user_id를 파일명에 붙여줌
    file_path = f"ment_{now.timestamp()}_{user_id}"

    ment = Ment(
        title=ment_in.title,
        sub_title=ment_in.sub_title,
        content=ment_in.content,
        user_id=user_id,
        file_path=file_path,
        created_dt=now,
        modified_dt=now,
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


def get_ments_by_user_id(*, session: Session, user_id: UUID, skip: int, limit: int) -> List[MentPublic]:
    statement = select(Ment).where(Ment.user_id == user_id).offset(skip).limit(limit)
    return session.exec(statement).all()
