# Progress 存储链路打通 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端计算好的阅读进度百分比（0–100）通过 `POST /api/update_current_book` 真正写入数据库，并在 `GET /api/books` 响应中正确返回，使书架进度条实时同步。

**Architecture:** 三处改动形成完整链路：① 后端 schema 的 `UpdateCurrentBookRequest` 增加可选 `progress` 字段；② `user_service.update_current_book` 写入 `Book.progress`；③ 前端 `UpdateCurrentBookRequest` 类型增加 `progress?: number`，`ReaderPage.tsx` 移除 `void progress` 改为传入请求。所有改动向后兼容——`progress` 字段在后端为可选，旧调用方无需修改。

**Tech Stack:** FastAPI + Pydantic v2（后端），React 18 + TypeScript strict（前端），pytest（后端测试），Vitest（前端测试）

---

## File Map

| Action | Path | 职责 |
|--------|------|------|
| Modify | `backend/app/schemas/users.py` | `UpdateCurrentBookRequest` 增加 `progress: int \| None = None` |
| Modify | `backend/app/services/user_service.py` | `update_current_book` 写入 `Book.progress` |
| Modify | `backend/tests/api/test_users_routes.py` | 补充 `progress` 字段写入和返回的测试 |
| Modify | `frontend/src/api/types.ts` | `UpdateCurrentBookRequest` 增加 `progress?: number` |
| Modify | `frontend/src/features/reader/ReaderPage.tsx` | 移除 `void progress`，改为传入 `progress` 给 `updateCurrentBook` |
| Modify | `frontend/src/api/hooks/useReader.test.tsx` | 更新 `useUpdateCurrentBook` 测试，传入 `progress` |

---

## Task 1：后端 schema + service 支持 progress

**Files:**
- Modify: `backend/app/schemas/users.py`
- Modify: `backend/app/services/user_service.py`
- Modify: `backend/tests/api/test_users_routes.py`

### 当前代码

`backend/app/schemas/users.py` 当前：
```python
class UpdateCurrentBookRequest(BaseModel):
    user_id: str
    book_id: str
```

`backend/app/services/user_service.py` 当前 `update_current_book`：
```python
def update_current_book(
    req: UpdateCurrentBookRequest, session: Session
) -> dict[str, bool]:
    user = session.get(User, req.user_id)
    if not user:
        raise LookupError(f"User not found: {req.user_id}")
    user.current_book_id = req.book_id
    session.add(user)
    session.commit()
    logger.info("Updated current book user_id=%s book_id=%s", req.user_id, req.book_id)
    return {"success": True}
```

`backend/app/models/models.py` 中 `Book` 模型已有：
```python
progress: int = Field(default=0)
```

- [ ] **Step 1: 编写失败测试**

在 `backend/tests/api/test_users_routes.py` 末尾追加：

```python
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/qadmlee/cmblab/HuiYi/backend
uv run pytest tests/api/test_users_routes.py::test_update_current_book_with_progress -v
```

预期：FAIL — `progress` 字段被忽略，`target["progress"]` 为 0 而非 42。

- [ ] **Step 3: 修改 schema**

将 `backend/app/schemas/users.py` 改为：

```python
from pydantic import BaseModel


class UserProfileResponse(BaseModel):
    username: str
    avatar: str
    signature: str


class UpdateCurrentBookRequest(BaseModel):
    user_id: str
    book_id: str
    progress: int | None = None


class CurrentBookResponse(BaseModel):
    book_id: str | None
    title: str | None = None
    author: str | None = None
```

- [ ] **Step 4: 修改 service**

将 `backend/app/services/user_service.py` 中的 `update_current_book` 改为：

```python
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

    session.commit()
    logger.info(
        "Updated current book user_id=%s book_id=%s progress=%s",
        req.user_id,
        req.book_id,
        req.progress,
    )
    return {"success": True}
```

注意：同时需要在文件顶部的 imports 中加上 `Book`：

```python
from app.models.models import Book, User
```

（检查当前 import，若已有 `Book` 则不需要重复添加。）

- [ ] **Step 5: 运行测试确认通过**

```bash
cd /Users/qadmlee/cmblab/HuiYi/backend
uv run pytest tests/api/test_users_routes.py -v
```

预期：全部 8 个测试通过（原有 7 个 + 新增 1 个）。

- [ ] **Step 6: 运行完整后端测试套件**

```bash
cd /Users/qadmlee/cmblab/HuiYi/backend
uv run pytest -v 2>&1 | tail -10
```

预期：37 个测试全部通过。

- [ ] **Step 7: 运行 Auto Gate**

```bash
cd /Users/qadmlee/cmblab/HuiYi/backend
uv run ruff format --check .
uv run ruff check .
uv run mypy app
```

预期：全部通过。

- [ ] **Step 8: 提交**

```bash
cd /Users/qadmlee/cmblab/HuiYi
git add backend/app/schemas/users.py \
  backend/app/services/user_service.py \
  backend/tests/api/test_users_routes.py
git commit -m "feat(backend): support progress field in update_current_book endpoint"
```

---

## Task 2：前端类型 + ReaderPage 传入 progress

**Files:**
- Modify: `frontend/src/api/types.ts`
- Modify: `frontend/src/features/reader/ReaderPage.tsx`
- Modify: `frontend/src/api/hooks/useReader.test.tsx`

### 当前代码

`frontend/src/api/types.ts` 当前：
```typescript
export interface UpdateCurrentBookRequest {
  user_id: number;
  book_id: number;
}
```

`frontend/src/features/reader/ReaderPage.tsx` 当前 useEffect（关键部分）：
```typescript
useEffect(() => {
  if (!bookIdNum || !userId || !content) return;
  const totalPages = paginate(content, CHARS_PER_PAGE).length;
  const progress =
    totalPages > 1
      ? Math.round((currentPage / (totalPages - 1)) * 100)
      : 100;
  updateCurrentBook({ user_id: userId, book_id: bookIdNum });
  // progress is computed but API doesn't accept it yet
  void progress;
}, [currentPage, bookIdNum, userId, content, updateCurrentBook]);
```

**注意：** 前端 `user_id` 是 `number`，后端 schema 是 `str`。这是已有的历史设计，不在本次修改范围内——保持一致即可。后端路由接受 `str`，前端传 `number`，FastAPI 会自动转换。

`frontend/src/api/hooks/useReader.test.tsx` 中的 `useUpdateCurrentBook` 测试：
```typescript
describe("useUpdateCurrentBook", () => {
  it("sends update and returns success", async () => {
    const { result } = renderHook(() => useUpdateCurrentBook(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ user_id: 1, book_id: 1 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

MSW handler（`frontend/src/test/handlers.ts`）已有：
```typescript
http.post("/api/update_current_book", () =>
  Response.json({ success: true }),
),
```
该 handler 不需要修改——它接受任何 POST body 并返回成功。

- [ ] **Step 1: 修改前端类型**

将 `frontend/src/api/types.ts` 中的 `UpdateCurrentBookRequest` 改为：

```typescript
export interface UpdateCurrentBookRequest {
  user_id: number;
  book_id: number;
  progress?: number;
}
```

- [ ] **Step 2: 修改 ReaderPage.tsx**

将 `frontend/src/features/reader/ReaderPage.tsx` 中的 useEffect 改为：

```typescript
useEffect(() => {
  if (!bookIdNum || !userId || !content) return;
  const totalPages = paginate(content, CHARS_PER_PAGE).length;
  const progress =
    totalPages > 1
      ? Math.round((currentPage / (totalPages - 1)) * 100)
      : 100;
  updateCurrentBook({ user_id: userId, book_id: bookIdNum, progress });
}, [currentPage, bookIdNum, userId, content, updateCurrentBook]);
```

注意：
- 移除 `void progress` 这一行
- 移除注释 `// progress is computed but API doesn't accept it yet`
- 移除 `// Fires on every page turn...` 上方的说明注释（或保留，根据实际情况）
- `biome-ignore` 注释若存在保留不动

- [ ] **Step 3: 运行前端测试确认通过**

```bash
cd /Users/qadmlee/cmblab/HuiYi/frontend
pnpm test -- src/features/reader/ReaderPage.test.tsx src/api/hooks/useReader.test.tsx
```

预期：全部通过。

- [ ] **Step 4: 运行完整前端测试套件**

```bash
cd /Users/qadmlee/cmblab/HuiYi/frontend
pnpm test
```

预期：所有测试通过（原有 94 个测试不减少）。

- [ ] **Step 5: 运行前端 Auto Gate**

```bash
cd /Users/qadmlee/cmblab/HuiYi/frontend
pnpm check
pnpm typecheck
pnpm build
```

预期：全部通过。

- [ ] **Step 6: 提交**

```bash
cd /Users/qadmlee/cmblab/HuiYi
git add frontend/src/api/types.ts \
  frontend/src/features/reader/ReaderPage.tsx
git commit -m "feat(frontend): pass progress to update_current_book API call"
```
