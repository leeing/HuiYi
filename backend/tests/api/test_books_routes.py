import base64

from fastapi.testclient import TestClient


def _register_and_get_user_id(client: TestClient, username: str = "reader") -> str:
    resp = client.post(
        "/api/register", json={"username": username, "password": "testpass"}
    )
    return resp.json()["user_id"]


def test_get_books_returns_default(client: TestClient) -> None:
    user_id = _register_and_get_user_id(client)
    resp = client.get(f"/api/books?user_id={user_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert "books" in data
    assert len(data["books"]) >= 1


def test_upload_and_list_book(client: TestClient) -> None:
    user_id = _register_and_get_user_id(client, "uploader")
    content = base64.b64encode("测试内容".encode()).decode()
    resp = client.post(
        "/api/upload",
        json={
            "user_id": user_id,
            "filename": "test.txt",
            "content": content,
            "author": "作者",
        },
    )
    assert resp.status_code == 200
    assert "book_id" in resp.json()
