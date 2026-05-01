import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from app.core.security import verify_password
from app.models.models import Book, User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import login_user, register_user


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_register_user_creates_user(session: Session) -> None:
    req = RegisterRequest(username="alice", password="testpass")
    response = register_user(req, session)
    assert response.user_id != ""
    assert response.message == "Success"


def test_register_user_hashes_password(session: Session) -> None:
    req = RegisterRequest(username="bob", password="testpass")
    register_user(req, session)
    user = session.exec(select(User).where(User.username == "bob")).first()
    assert user is not None
    assert verify_password("testpass", user.password_hash)


def test_register_user_adds_default_books(session: Session) -> None:
    req = RegisterRequest(username="carol", password="testpass")
    register_user(req, session)
    user = session.exec(select(User).where(User.username == "carol")).first()
    assert user is not None
    books = session.exec(select(Book).where(Book.user_id == user.id)).all()
    assert len(books) >= 1


def test_register_duplicate_username_raises(session: Session) -> None:
    req = RegisterRequest(username="dave", password="testpass")
    register_user(req, session)
    with pytest.raises(ValueError, match="Username taken"):
        register_user(req, session)


def test_login_user_success(session: Session) -> None:
    register_user(RegisterRequest(username="eve", password="testpass"), session)
    response = login_user(LoginRequest(username="eve", password="testpass"), session)
    assert response.user_id != ""
    assert response.message == "Login successful"


def test_login_user_wrong_password_raises(session: Session) -> None:
    register_user(RegisterRequest(username="frank", password="correct"), session)
    with pytest.raises(ValueError, match="Invalid credentials"):
        login_user(LoginRequest(username="frank", password="wrongpass"), session)


def test_login_user_unknown_user_raises(session: Session) -> None:
    with pytest.raises(ValueError, match="Invalid credentials"):
        login_user(LoginRequest(username="ghost", password="anypass"), session)
