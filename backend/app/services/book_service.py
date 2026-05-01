import base64
import logging
import uuid
from pathlib import Path

from sqlmodel import Session, col, select

from app.core.config import settings
from app.models.models import Book
from app.schemas.books import (
    BookContentResponse,
    BookListResponse,
    BookOut,
    UploadRequest,
)

logger = logging.getLogger("huiyi.books")


def get_books(user_id: str, session: Session) -> BookListResponse:
    books = session.exec(
        select(Book).where(Book.user_id == user_id).order_by(col(Book.added_at).desc())
    ).all()
    return BookListResponse(
        books=[
            BookOut(id=b.id, title=b.title, author=b.author, progress=b.progress)
            for b in books
        ]
    )


def get_book_content(
    book_id: str,
    session: Session,
    books_dir: Path | None = None,
) -> BookContentResponse:
    book = session.get(Book, book_id)
    if not book:
        raise LookupError(f"Book not found: {book_id}")

    bdir = books_dir if books_dir is not None else settings.BOOKS_DIR
    full_path = bdir / book.filepath

    try:
        content = full_path.read_text(encoding="utf-8")
    except OSError as exc:
        raise OSError(f"Cannot read book file: {full_path}") from exc

    return BookContentResponse(title=book.title, author=book.author, content=content)


def upload_book(
    req: UploadRequest,
    session: Session,
    books_dir: Path | None = None,
) -> dict[str, str]:
    bdir = books_dir if books_dir is not None else settings.BOOKS_DIR
    bdir.mkdir(parents=True, exist_ok=True)

    raw_content = req.content
    if "," in raw_content:
        raw_content = raw_content.split(",", 1)[1]

    file_bytes = base64.b64decode(raw_content)
    safe_filename = f"{uuid.uuid4().hex}_{req.filename}"
    file_path = bdir / safe_filename
    file_path.write_bytes(file_bytes)

    title = Path(req.filename).stem
    book = Book(
        user_id=req.user_id,
        title=title,
        author=req.author,
        filepath=safe_filename,
    )
    session.add(book)
    session.commit()
    session.refresh(book)

    logger.info("Uploaded book title=%s user_id=%s", title, req.user_id)
    return {"message": "Upload successful", "book_id": book.id}
