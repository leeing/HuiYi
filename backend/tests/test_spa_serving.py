"""Tests for SPA static file serving — route registration order."""

from fastapi.testclient import TestClient


def test_api_route_not_caught_by_spa_fallback(client: TestClient) -> None:
    """API routes must not be handled by the SPA fallback."""
    resp = client.get("/api/login")
    assert resp.status_code in (404, 405, 422)
    assert "text/html" not in resp.headers.get("content-type", "")


def test_spa_fallback_returns_html_when_dist_exists(client: TestClient) -> None:
    """GET /reader/123 should return index.html when frontend/dist is built."""
    resp = client.get("/reader/123")
    if resp.status_code == 200:
        assert "text/html" in resp.headers.get("content-type", "")
    elif resp.status_code == 503:
        pass  # dist not built — graceful degradation
    else:
        raise AssertionError(f"Unexpected status code: {resp.status_code}")
