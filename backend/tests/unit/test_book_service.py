import base64
from pathlib import Path

import pytest
from sqlmodel import Session, SQLModel, create_engine

from app.schemas.auth import RegisterRequest
from app.schemas.books import UploadRequest
from app.services.auth_service import register_user
from app.services.book_service import get_book_content, get_books, upload_book


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="user_id")
def user_id_fixture(session: Session) -> str:
    resp = register_user(
        RegisterRequest(username="reader", password="testpass"), session
    )
    return resp.user_id


def test_get_books_returns_default_books(session: Session, user_id: str) -> None:
    books = get_books(user_id, session)
    assert len(books.books) >= 1


def test_upload_book(session: Session, user_id: str, tmp_path: Path) -> None:
    content = "这是一本测试书籍的内容。"
    encoded = base64.b64encode(content.encode("utf-8")).decode()
    req = UploadRequest(
        user_id=user_id,
        filename="test.txt",
        content=encoded,
        author="测试作者",
    )
    result = upload_book(req, session, books_dir=tmp_path)
    assert result.get("book_id") != ""
    saved_files = list(tmp_path.iterdir())
    assert len(saved_files) == 1
    assert saved_files[0].read_text(encoding="utf-8") == content


def test_get_book_content(session: Session, user_id: str, tmp_path: Path) -> None:
    content = "测试内容"
    encoded = base64.b64encode(content.encode("utf-8")).decode()
    upload_result = upload_book(
        UploadRequest(user_id=user_id, filename="mybook.txt", content=encoded),
        session,
        books_dir=tmp_path,
    )
    book_id = upload_result["book_id"]
    result = get_book_content(book_id, session, books_dir=tmp_path)
    assert result.content == content
