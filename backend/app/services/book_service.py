from __future__ import annotations

import base64
import json
import logging
import uuid
from pathlib import Path
from typing import Any

from sqlmodel import Session, col, select

from app.core.config import settings
from app.models.models import Book
from app.schemas.books import (
    BookContentResponse,
    BookListResponse,
    BookMetadataResponse,
    BookOut,
    BookUpdateRequest,
    UploadRequest,
)
from app.services.document_parser import DocumentParser

logger = logging.getLogger("huiyi.books")

SUPPORTED_EXTENSIONS = {".txt", ".pdf", ".epub", ".mobi"}


def _get_file_type(filename: str) -> str:
    """Determine file type from filename extension."""
    ext = Path(filename).suffix.lower()
    if ext in SUPPORTED_EXTENSIONS:
        return ext.lstrip(".")
    return "txt"


def get_books(user_id: str, session: Session) -> BookListResponse:
    books = session.exec(
        select(Book).where(Book.user_id == user_id).order_by(col(Book.added_at).desc())
    ).all()
    return BookListResponse(
        books=[
            BookOut(
                id=b.id,
                title=b.title,
                author=b.author,
                progress=b.progress,
                file_type=b.file_type,
                file_size=b.file_size,
            )
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

    # Return cached content if available
    if book.content_cached:
        return BookContentResponse(
            title=book.title,
            author=book.author,
            content=book.content_cached,
            file_type=book.file_type,
        )

    bdir = books_dir if books_dir is not None else settings.BOOKS_DIR
    full_path = bdir / book.filepath

    try:
        content = DocumentParser.extract_text(full_path, book.file_type)
        # Cache the extracted content
        book.content_cached = content
        session.add(book)
        session.commit()
    except OSError as exc:
        raise OSError(f"Cannot read book file: {full_path}") from exc

    return BookContentResponse(
        title=book.title,
        author=book.author,
        content=content,
        file_type=book.file_type,
    )


def get_book_metadata(
    book_id: str,
    session: Session,
    books_dir: Path | None = None,
) -> BookMetadataResponse:
    book = session.get(Book, book_id)
    if not book:
        raise LookupError(f"Book not found: {book_id}")

    metadata = None
    if book.metadata_json:
        try:
            metadata = json.loads(book.metadata_json)
        except json.JSONDecodeError:
            logger.warning("Invalid metadata_json for book %s", book_id)

    return BookMetadataResponse(
        book_id=book.id,
        title=book.title,
        author=book.author,
        file_type=book.file_type,
        file_size=book.file_size,
        metadata=metadata,
    )


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

    file_type = _get_file_type(req.filename)
    file_size = len(file_bytes)

    # Extract metadata
    metadata: dict[str, Any] = {}
    try:
        metadata = DocumentParser.extract_metadata(file_path, file_type)
        # Override title/author from metadata if available
        title = metadata.get("title", "") or Path(req.filename).stem
        author = metadata.get("author", "") or req.author
    except Exception as exc:
        logger.warning("Metadata extraction failed for %s: %s", req.filename, exc)
        title = Path(req.filename).stem
        author = req.author

    book = Book(
        user_id=req.user_id,
        title=title,
        author=author,
        filepath=safe_filename,
        file_type=file_type,
        file_size=file_size,
        metadata_json=json.dumps(metadata) if metadata else None,
    )
    session.add(book)
    session.commit()
    session.refresh(book)

    logger.info(
        "Uploaded book title=%s user_id=%s file_type=%s", title, req.user_id, file_type
    )
    return {"message": "Upload successful", "book_id": book.id}


def update_book(
    book_id: str,
    req: BookUpdateRequest,
    session: Session,
) -> dict[str, str]:
    book = session.get(Book, book_id)
    if not book:
        raise LookupError(f"Book not found: {book_id}")

    if req.title is not None:
        book.title = req.title
    if req.author is not None:
        book.author = req.author

    session.add(book)
    session.commit()

    logger.info("Updated book %s: title=%s author=%s", book_id, book.title, book.author)
    return {"message": "Update successful"}


def remove_book(
    book_id: str,
    session: Session,
    books_dir: Path | None = None,
) -> dict[str, str]:
    book = session.get(Book, book_id)
    if not book:
        raise LookupError(f"Book not found: {book_id}")

    bdir = books_dir if books_dir is not None else settings.BOOKS_DIR
    file_path = bdir / book.filepath

    # Delete file if exists
    if file_path.exists():
        file_path.unlink()

    # Delete database record
    session.delete(book)
    session.commit()

    logger.info("Deleted book %s", book_id)
    return {"message": "Delete successful"}


def get_download_info(
    book_id: str,
    session: Session,
    books_dir: Path | None = None,
) -> tuple[Path, str, str]:
    """Get file path, filename, and media type for book download."""
    book = session.get(Book, book_id)
    if not book:
        raise LookupError(f"Book not found: {book_id}")

    bdir = books_dir if books_dir is not None else settings.BOOKS_DIR
    file_path = bdir / book.filepath

    if not file_path.exists():
        raise LookupError(f"File not found: {file_path}")

    media_type = {
        "txt": "text/plain",
        "pdf": "application/pdf",
        "epub": "application/epub+zip",
        "mobi": "application/x-mobipocket-ebook",
    }.get(book.file_type, "application/octet-stream")

    filename = f"{book.title}.{book.file_type}"
    return file_path, filename, media_type
