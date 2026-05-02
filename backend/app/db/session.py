from __future__ import annotations

from collections.abc import Generator
from typing import TYPE_CHECKING, Any

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

if TYPE_CHECKING:
    from sqlalchemy import Engine

_engine: Engine | None = None


def get_engine() -> Engine:
    """Return (and lazily create) the SQLAlchemy engine."""
    global _engine
    if _engine is None:
        if not settings.DATABASE_URL:
            raise RuntimeError(
                "DATABASE_URL is not configured. "
                "Set it to a PostgreSQL DSN, e.g. postgresql+psycopg2://user:pass@host/db"
            )
        _engine = create_engine(settings.DATABASE_URL, echo=False)
    return _engine


def __getattr__(name: str) -> Any:
    """Lazy module-level ``engine`` attribute for backwards compatibility."""
    if name == "engine":
        return get_engine()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(get_engine())


def get_session() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session
