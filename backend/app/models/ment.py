import uuid
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional


class MentBase(SQLModel):
    title: str = Field(max_length=255)
    sub_title: Optional[str] = Field(default=None, max_length=255)
    content: str


class MentCreate(MentBase):
    pass


class MentUpdate(MentBase):
    modified_dt: datetime = Field(default_factory=datetime.now)


class Ment(MentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    created_dt: datetime = Field(default_factory=datetime.now)
    modified_dt: datetime = Field(default_factory=datetime.now)
    file_path: Optional[str] = Field(default=None, max_length=255)  # 멘트가 저장된 파일 경로
    user: Optional["User"] = Relationship(back_populates="ments")


# 멘트 리스트 DB에서 가져올 때 사용할 모델
class MentPublic(MentBase):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    file_path: Optional[str] = Field(default=None, max_length=255)  # 멘트가 저장된 파일 경로
    modified_dt: datetime = Field(default_factory=datetime.now)