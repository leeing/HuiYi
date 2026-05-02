import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

import app.db.session as db_session_module
from app.db.session import get_session
from app.main import app


def _make_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


# Patch the lazy engine so main.py lifespan doesn't raise RuntimeError on import.
# Individual fixtures override this per-test for isolation.
db_session_module._engine = _make_engine()  # type: ignore[attr-defined]


@pytest.fixture(name="session")
def session_fixture():
    engine = _make_engine()
    # Also patch module engine so lifespan uses the same in-memory DB
    db_session_module._engine = engine  # type: ignore[attr-defined]
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
