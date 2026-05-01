from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.schemas.books import BookContentResponse, BookListResponse, UploadRequest
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


@router.post("/upload")
def upload(req: UploadRequest, session: SessionDep) -> dict[str, str]:
    return book_service.upload_book(req, session)
