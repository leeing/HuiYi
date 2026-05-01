from pydantic import BaseModel


class UserProfileResponse(BaseModel):
    username: str
    avatar: str
    signature: str


class UpdateCurrentBookRequest(BaseModel):
    user_id: str
    book_id: str


class CurrentBookResponse(BaseModel):
    book_id: str | None
    title: str | None = None
    author: str | None = None
