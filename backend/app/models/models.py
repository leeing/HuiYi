import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


def _new_uuid() -> str:
    return str(uuid.uuid4())


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=_new_uuid, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    avatar: str = Field(default="default_avatar_1.svg")
    signature: str = Field(default="懂书也懂你")
    current_book_id: str | None = Field(default=None)


class Book(SQLModel, table=True):
    __tablename__ = "books"

    id: str = Field(default_factory=_new_uuid, primary_key=True)
    user_id: str = Field(index=True)
    title: str
    author: str = Field(default="Unknown")
    filepath: str
    progress: int = Field(default=0)
    added_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
