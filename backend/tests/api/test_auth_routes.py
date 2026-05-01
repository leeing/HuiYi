from fastapi.testclient import TestClient


def test_register_success(client: TestClient) -> None:
    resp = client.post("/api/register", json={"username": "alice", "password": "testpass"})
    assert resp.status_code == 200
    data = resp.json()
    assert "user_id" in data
    assert data["message"] == "Success"


def test_register_duplicate_username(client: TestClient) -> None:
    client.post("/api/register", json={"username": "bob", "password": "testpass"})
    resp = client.post("/api/register", json={"username": "bob", "password": "testpass2"})
    assert resp.status_code == 400
    assert "Username taken" in resp.json()["detail"]


def test_login_success(client: TestClient) -> None:
    client.post("/api/register", json={"username": "carol", "password": "testpass"})
    resp = client.post("/api/login", json={"username": "carol", "password": "testpass"})
    assert resp.status_code == 200
    assert resp.json()["message"] == "Login successful"


def test_login_wrong_password(client: TestClient) -> None:
    client.post("/api/register", json={"username": "dave", "password": "correct"})
    resp = client.post("/api/login", json={"username": "dave", "password": "wrongpass"})
    assert resp.status_code == 401


def test_login_unknown_user(client: TestClient) -> None:
    resp = client.post("/api/login", json={"username": "ghost", "password": "anypass"})
    assert resp.status_code == 401
