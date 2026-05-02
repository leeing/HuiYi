import logging

from sqlmodel import Session, col, select

from app.models.models import Book, User
from app.schemas.users import (
    CurrentBookResponse,
    UpdateCurrentBookRequest,
    UserProfileResponse,
)

logger = logging.getLogger("huiyi.users")


def get_user_profile(user_id: str, session: Session) -> UserProfileResponse:
    user = session.get(User, user_id)
    if not user:
        raise LookupError(f"User not found: {user_id}")
    return UserProfileResponse(
        username=user.username,
        avatar=user.avatar,
        signature=user.signature,
    )


def get_current_book(user_id: str, session: Session) -> CurrentBookResponse:
    user = session.get(User, user_id)
    if not user:
        raise LookupError(f"User not found: {user_id}")

    book_id = user.current_book_id
    if not book_id:
        book = session.exec(
            select(Book)
            .where(Book.user_id == user_id)
            .order_by(col(Book.added_at).desc())
        ).first()
        if book:
            return CurrentBookResponse(
                book_id=book.id, title=book.title, author=book.author
            )
        return CurrentBookResponse(book_id=None)

    book = session.get(Book, book_id)
    if not book:
        return CurrentBookResponse(book_id=None)
    return CurrentBookResponse(book_id=book.id, title=book.title, author=book.author)


def update_current_book(
    req: UpdateCurrentBookRequest, session: Session
) -> dict[str, bool]:
    user = session.get(User, req.user_id)
    if not user:
        raise LookupError(f"User not found: {req.user_id}")
    user.current_book_id = req.book_id
    session.add(user)

    if req.progress is not None:
        book = session.get(Book, req.book_id)
        if book and book.user_id == req.user_id:
            book.progress = max(0, min(100, req.progress))
            session.add(book)
        elif book:
            logger.warning(
                "Progress update skipped: book_id=%s does not belong to user_id=%s",
                req.book_id,
                req.user_id,
            )

    session.commit()
    logger.info(
        "Updated current book user_id=%s book_id=%s progress=%s",
        req.user_id,
        req.book_id,
        req.progress,
    )
    return {"success": True}
