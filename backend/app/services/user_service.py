import logging

from sqlmodel import Session, select

from app.models.models import Book, User
from app.schemas.users import CurrentBookResponse, UpdateCurrentBookRequest, UserProfileResponse

logger = logging.getLogger("huiyi.users")


def get_user_profile(user_id: str, session: Session) -> UserProfileResponse:
    user = session.get(User, user_id)
    if not user:
        raise LookupError(f"User not found: {user_id}")
    return UserProfileResponse(
        username=user.username,
        avatar=user.avatar or "default_avatar_1.svg",
        signature=user.signature or "懂书也懂你",
    )


def get_current_book(user_id: str, session: Session) -> CurrentBookResponse:
    user = session.get(User, user_id)
    if not user:
        raise LookupError(f"User not found: {user_id}")

    book_id = user.current_book_id
    if not book_id:
        book = session.exec(
            select(Book).where(Book.user_id == user_id).order_by(Book.added_at.desc())
        ).first()
        if book:
            return CurrentBookResponse(book_id=book.id, title=book.title, author=book.author)
        return CurrentBookResponse(book_id=None)

    book = session.get(Book, book_id)
    if not book:
        return CurrentBookResponse(book_id=None)
    return CurrentBookResponse(book_id=book.id, title=book.title, author=book.author)


def update_current_book(req: UpdateCurrentBookRequest, session: Session) -> dict[str, bool]:
    user = session.get(User, req.user_id)
    if not user:
        raise LookupError(f"User not found: {req.user_id}")
    user.current_book_id = req.book_id
    session.add(user)
    session.commit()
    logger.info("Updated current book user_id=%s book_id=%s", req.user_id, req.book_id)
    return {"success": True}
