import base64

from fastapi.testclient import TestClient


def _register(client: TestClient, username: str = "testuser") -> str:
    resp = client.post(
        "/api/register", json={"username": username, "password": "testpass"}
    )
    return resp.json()["user_id"]


def _upload_book(client: TestClient, user_id: str, title: str = "测试书") -> str:
    content = base64.b64encode("书籍内容".encode()).decode()
    resp = client.post(
        "/api/upload",
        json={
            "user_id": user_id,
            "filename": f"{title}.txt",
            "content": content,
            "author": "作者",
        },
    )
    return resp.json()["book_id"]


# --- /api/user_profile ---


def test_user_profile_success(client: TestClient) -> None:
    user_id = _register(client, "alice")
    resp = client.get(f"/api/user_profile?user_id={user_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "alice"
    assert "avatar" in data
    assert "signature" in data


def test_user_profile_not_found(client: TestClient) -> None:
    resp = client.get("/api/user_profile?user_id=nonexistent-id")
    assert resp.status_code == 404


# --- /api/current_book ---


def test_current_book_returns_latest_when_no_current_set(client: TestClient) -> None:
    user_id = _register(client, "carol")
    book_id = _upload_book(client, user_id, "书籍A")
    resp = client.get(f"/api/current_book?user_id={user_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["book_id"] == book_id
    assert data["title"] == "书籍A"


def test_current_book_not_found_user(client: TestClient) -> None:
    resp = client.get("/api/current_book?user_id=nonexistent-id")
    assert resp.status_code == 404


# --- /api/update_current_book ---


def test_update_current_book_success(client: TestClient) -> None:
    user_id = _register(client, "dave")
    book_id = _upload_book(client, user_id)
    resp = client.post(
        "/api/update_current_book",
        json={"user_id": user_id, "book_id": book_id},
    )
    assert resp.status_code == 200
    assert resp.json() == {"success": True}


def test_update_current_book_persists(client: TestClient) -> None:
    user_id = _register(client, "eve")
    book_id = _upload_book(client, user_id, "持久化测试书")
    update_resp = client.post(
        "/api/update_current_book",
        json={"user_id": user_id, "book_id": book_id},
    )
    assert update_resp.status_code == 200
    resp = client.get(f"/api/current_book?user_id={user_id}")
    assert resp.status_code == 200
    assert resp.json()["book_id"] == book_id


def test_update_current_book_user_not_found(client: TestClient) -> None:
    resp = client.post(
        "/api/update_current_book",
        json={"user_id": "nonexistent-id", "book_id": "some-book-id"},
    )
    assert resp.status_code == 404


def test_update_current_book_with_progress(client: TestClient) -> None:
    user_id = _register(client, "frank")
    book_id = _upload_book(client, user_id, "进度书")
    resp = client.post(
        "/api/update_current_book",
        json={"user_id": user_id, "book_id": book_id, "progress": 42},
    )
    assert resp.status_code == 200
    assert resp.json() == {"success": True}
    # 验证进度写入：通过 /api/books 查询 progress 字段
    books_resp = client.get(f"/api/books?user_id={user_id}")
    assert books_resp.status_code == 200
    books = books_resp.json()["books"]
    target = next((b for b in books if b["id"] == book_id), None)
    assert target is not None
    assert target["progress"] == 42
