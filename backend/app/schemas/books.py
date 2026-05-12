from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class BookOut(BaseModel):
    id: str
    title: str
    author: str
    progress: int
    file_type: str = "txt"
    file_size: int = 0


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
    file_type: str = "txt"


class BookMetadataResponse(BaseModel):
    book_id: str
    title: str
    author: str
    file_type: str
    file_size: int
    metadata: dict[str, Any] | None = None


class BookUpdateRequest(BaseModel):
    title: str | None = None
    author: str | None = None
