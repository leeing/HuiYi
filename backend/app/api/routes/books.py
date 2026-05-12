from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse

from app.api.deps import SessionDep
from app.schemas.books import (
    BookContentResponse,
    BookListResponse,
    BookMetadataResponse,
    BookUpdateRequest,
    UploadRequest,
)
from app.services import book_service

router = APIRouter()


@router.get("/books", response_model=BookListResponse)
def list_books(user_id: str, session: SessionDep) -> BookListResponse:
    return book_service.get_books(user_id, session)


@router.get("/book_content", response_model=BookContentResponse)
def book_content(book_id: str, session: SessionDep) -> BookContentResponse:
    try:
        return book_service.get_book_content(book_id, session)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/book_metadata/{book_id}", response_model=BookMetadataResponse)
def book_metadata(book_id: str, session: SessionDep) -> BookMetadataResponse:
    try:
        return book_service.get_book_metadata(book_id, session)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/upload")
def upload(req: UploadRequest, session: SessionDep) -> dict[str, str]:
    return book_service.upload_book(req, session)


@router.patch("/book/{book_id}")
def update_book(
    book_id: str,
    req: BookUpdateRequest,
    session: SessionDep,
) -> dict[str, str]:
    try:
        return book_service.update_book(book_id, req, session)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/book/{book_id}")
def delete_book(book_id: str, session: SessionDep) -> dict[str, str]:
    try:
        return book_service.remove_book(book_id, session)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/book/{book_id}/download")
def download_book(
    book_id: str,
    session: SessionDep,
) -> Response:
    try:
        file_path, filename, media_type = book_service.get_download_info(
            book_id, session
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type,
    )
