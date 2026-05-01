import logging

from sqlmodel import Session, select

from app.core.security import hash_password, verify_password
from app.models.models import Book, User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest

logger = logging.getLogger("huiyi.auth")

DEFAULT_BOOKS: list[tuple[str, str, str]] = [
    ("红楼梦", "曹雪芹", "cc325b26ff584180bf504bcf50a44514.txt"),
    ("生育制度", "费孝通", "f653423cc7d24a929180bccaf790d219.txt"),
    ("长安的荔枝", "马伯庸", "9180b8ab333f44cabd0c98dd5d9c76be.txt"),
    ("基层女性", "王慧玲", "jicengNvxing.txt"),
]


def _add_default_books(user_id: str, session: Session) -> None:
    for title, author, filename in DEFAULT_BOOKS:
        existing = session.exec(
            select(Book).where(Book.user_id == user_id, Book.filepath == filename)
        ).first()
        if not existing:
            book = Book(user_id=user_id, title=title, author=author, filepath=filename)
            session.add(book)


def register_user(req: RegisterRequest, session: Session) -> AuthResponse:
    existing = session.exec(select(User).where(User.username == req.username)).first()
    if existing:
        raise ValueError("Username taken")

    user = User(
        username=req.username,
        password_hash=hash_password(req.password),
        avatar=req.avatar,
        signature=req.signature,
    )
    session.add(user)
    session.flush()  # get user.id

    _add_default_books(user.id, session)
    session.commit()
    session.refresh(user)

    logger.info("Registered user username=%s", req.username)
    return AuthResponse(
        message="Success",
        user_id=user.id,
        avatar=user.avatar,
        signature=user.signature,
    )


def login_user(req: LoginRequest, session: Session) -> AuthResponse:
    user = session.exec(select(User).where(User.username == req.username)).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise ValueError("Invalid credentials")

    logger.info("Login success username=%s", req.username)
    return AuthResponse(
        message="Login successful",
        user_id=user.id,
        avatar=user.avatar,
        signature=user.signature,
    )


def seed_default_data(session: Session) -> None:
    """Seed test users and default books on first startup."""
    count = session.exec(select(User)).all()
    if count:
        return

    test_users = [
        ("test_user_1", "123456", "default_avatar_1.svg", "书山有路勤为径"),
        ("book_lover", "123456", "default_avatar_2.svg", "也就是想读点好书"),
        ("poem_soul", "123456", "default_avatar_3.svg", "生活不只是眼前的苟且"),
    ]
    for username, pw, avatar, signature in test_users:
        user = User(
            username=username,
            password_hash=hash_password(pw),
            avatar=avatar,
            signature=signature,
        )
        session.add(user)
        session.flush()
        _add_default_books(user.id, session)

    session.commit()
    logger.info("Seeded default test users and books")
