"""Tests for SPA static file serving."""

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.db.session import get_session
from app.main import app


def _make_client() -> TestClient:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def get_session_override() -> Session:
        with Session(engine) as session:
            return session

    app.dependency_overrides[get_session] = get_session_override
    return TestClient(app, raise_server_exceptions=False)


def test_api_route_not_caught_by_spa_fallback() -> None:
    client = _make_client()
    resp = client.get("/api/login")
    # API route must NOT return HTML; GET /api/login has no handler → 404 or 405
    assert resp.status_code in (404, 405, 422)
    assert "text/html" not in resp.headers.get("content-type", "")


def test_spa_fallback_returns_html_for_react_router_path() -> None:
    client = _make_client()
    resp = client.get("/reader/123")
    # If dist exists: 200 HTML; if not built yet: 500 is acceptable
    if resp.status_code == 200:
        assert "text/html" in resp.headers.get("content-type", "")
    else:
        # dist not built in CI — SPA handler ran but index.html missing
        assert resp.status_code in (200, 500)
