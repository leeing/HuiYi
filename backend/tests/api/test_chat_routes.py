from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient


def test_chat_returns_ai_response(client: TestClient) -> None:
    with patch(
        "app.api.routes.chat.get_chat_response",
        new=AsyncMock(return_value="这是模拟的 AI 回复。"),
    ):
        resp = client.post(
            "/api/chat",
            json={"message": "你好，帮我解释一下这段文字"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"response": "这是模拟的 AI 回复。"}


def test_chat_with_user_id_and_context(client: TestClient) -> None:
    with patch(
        "app.api.routes.chat.get_chat_response",
        new=AsyncMock(return_value="结合上下文的回复。"),
    ) as mock_fn:
        resp = client.post(
            "/api/chat",
            json={
                "message": "这句话什么意思",
                "user_id": "some-user-id",
                "book_context": "第一章 开始\n\n这是书的内容片段。",
            },
        )
    assert resp.status_code == 200
    assert resp.json()["response"] == "结合上下文的回复。"
    mock_fn.assert_awaited_once()
    call_kwargs = mock_fn.call_args.kwargs
    assert call_kwargs["message"] == "这句话什么意思"
    assert call_kwargs["user_id"] == "some-user-id"
    assert "第一章" in call_kwargs["book_context"]


def test_chat_empty_message_still_calls_service(client: TestClient) -> None:
    with patch(
        "app.api.routes.chat.get_chat_response",
        new=AsyncMock(return_value="空消息回复。"),
    ):
        resp = client.post("/api/chat", json={"message": ""})
    assert resp.status_code == 200


def test_chat_missing_message_returns_422(client: TestClient) -> None:
    resp = client.post("/api/chat", json={})
    assert resp.status_code == 422
