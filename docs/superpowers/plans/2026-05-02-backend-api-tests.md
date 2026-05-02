# 后端 API 测试覆盖补全 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为目前缺少测试的四个路由组补充集成测试：`/api/user_profile`、`/api/current_book`、`/api/update_current_book`、`/api/chat`。

**Architecture:** 沿用现有 `conftest.py` 的 `client` fixture（SQLite in-memory + FastAPI TestClient）。chat 路由依赖外部 DashScope API，通过 `monkeypatch` 覆盖 `get_chat_response` 避免真实网络调用。所有测试文件放在 `backend/tests/api/`，遵循已有的 `_register_and_get_user_id` 辅助函数模式。

**Tech Stack:** Python 3.12, pytest, pytest-asyncio, FastAPI TestClient, SQLModel in-memory SQLite

---

## File Map

| Action | Path | 职责 |
|--------|------|------|
| Create | `backend/tests/api/test_users_routes.py` | `/user_profile`、`/current_book`、`/update_current_book` 的集成测试 |
| Create | `backend/tests/api/test_chat_routes.py` | `/chat` 路由集成测试（mock DashScope） |

---

## Task 1：users 路由测试

**Files:**
- Create: `backend/tests/api/test_users_routes.py`

### 背景

三个 users 路由行为：
- `GET /api/user_profile?user_id=` → 返回 `{username, avatar, signature}`，不存在时 404
- `GET /api/current_book?user_id=` → 返回 `{book_id, title?, author?}`，无书时 `book_id: null`
- `POST /api/update_current_book` body `{user_id, book_id}` → 返回 `{success: true}`，不存在时 404

辅助函数 `_register_and_get_user_id` 已在 `test_books_routes.py` 中存在，但**不要跨文件复用**——每个测试文件自包含。

- [ ] **Step 1: 编写失败测试**

创建 `backend/tests/api/test_users_routes.py`：

```python
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

def test_current_book_no_books(client: TestClient) -> None:
    user_id = _register(client, "bob")
    resp = client.get(f"/api/current_book?user_id={user_id}")
    assert resp.status_code == 200
    assert resp.json()["book_id"] is None


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
    client.post(
        "/api/update_current_book",
        json={"user_id": user_id, "book_id": book_id},
    )
    resp = client.get(f"/api/current_book?user_id={user_id}")
    assert resp.status_code == 200
    assert resp.json()["book_id"] == book_id


def test_update_current_book_user_not_found(client: TestClient) -> None:
    resp = client.post(
        "/api/update_current_book",
        json={"user_id": "nonexistent-id", "book_id": "some-book-id"},
    )
    assert resp.status_code == 404
```

- [ ] **Step 2: 确认测试失败（文件不存在时应该直接收集错误，但测试逻辑应先于实现写好）**

```bash
cd /Users/qadmlee/cmblab/HuiYi/backend
uv run pytest tests/api/test_users_routes.py -v 2>&1 | head -40
```

预期：7 个测试全部通过（路由已实现，只是缺测试）。若有失败，说明路由行为与预期不符，需要修复测试断言。

- [ ] **Step 3: 运行完整后端测试套件确认无回归**

```bash
cd /Users/qadmlee/cmblab/HuiYi/backend
uv run pytest -v 2>&1 | tail -15
```

预期：原有 25 个测试 + 新增 7 个 = 32 个通过。

- [ ] **Step 4: 提交**

```bash
cd /Users/qadmlee/cmblab/HuiYi
git add backend/tests/api/test_users_routes.py
git commit -m "test(backend): add integration tests for user_profile, current_book, update_current_book routes"
```

---

## Task 2：chat 路由测试

**Files:**
- Create: `backend/tests/api/test_chat_routes.py`

### 背景

`POST /api/chat` 接收 `{message, user_id?, book_context?}`，内部调用 `get_chat_response()`，后者最终会调用 DashScope 外部 API。测试中必须 mock 这个调用。

mock 目标：`app.api.routes.chat.get_chat_response`（路由层导入的名称）。

`ChatRequest` schema：
```python
class ChatRequest(BaseModel):
    message: str
    user_id: str = ""
    book_context: str = ""
```

`ChatResponse` schema：
```python
class ChatResponse(BaseModel):
    response: str
```

`DASHSCOPE_API_KEY` 为空时 `get_chat_response` 返回 `"AI 功能未配置（缺少 DASHSCOPE_API_KEY）"`，但这是 `call_dashscope` 内部行为，我们通过 mock 整个 `get_chat_response` 来完全隔离。

- [ ] **Step 1: 编写失败测试**

创建 `backend/tests/api/test_chat_routes.py`：

```python
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
    # 确认参数透传正确
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
```

- [ ] **Step 2: 运行测试，确认通过（路由和 mock 都正确）**

```bash
cd /Users/qadmlee/cmblab/HuiYi/backend
uv run pytest tests/api/test_chat_routes.py -v
```

预期：4 个测试全部通过。

若 `test_chat_with_user_id_and_context` 失败，检查 `chat.py` 路由传参顺序是否与 `get_chat_response` 签名一致：
```python
# app/api/routes/chat.py 中的调用：
response_text = await get_chat_response(
    message=req.message,
    user_id=req.user_id,
    book_context=req.book_context,
    session=session,
)
```
若参数名不一致，需修正测试中 `call_kwargs` 的断言键名。

- [ ] **Step 3: 运行完整后端测试套件**

```bash
cd /Users/qadmlee/cmblab/HuiYi/backend
uv run pytest -v 2>&1 | tail -15
```

预期：32 + 4 = 36 个测试全部通过。

- [ ] **Step 4: 运行 Auto Gate**

```bash
cd /Users/qadmlee/cmblab/HuiYi/backend
uv run ruff format --check .
uv run ruff check .
uv run mypy app
uv run pytest
```

预期：全部通过，无任何错误。

- [ ] **Step 5: 提交**

```bash
cd /Users/qadmlee/cmblab/HuiYi
git add backend/tests/api/test_chat_routes.py
git commit -m "test(backend): add integration tests for chat route with mocked DashScope"
```
