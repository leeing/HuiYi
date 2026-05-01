from pydantic import BaseModel


class BookOut(BaseModel):
    id: str
    title: str
    author: str
    progress: int


class BookListResponse(BaseModel):
    books: list[BookOut]


class UploadRequest(BaseModel):
    user_id: str
    filename: str
    content: str  # Base64 encoded
    author: str = "Unknown"


class BookContentResponse(BaseModel):
    title: str
    author: str
    content: str
