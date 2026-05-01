# 会意后端重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `run_app.py`（Python 原生 http.server + SQLite 原型）全量重构为 FastAPI + SQLModel + pydantic-settings + bcrypt 生产规范后端，同时保持所有 API 路径兼容，使现有 HTML 前端无需修改。

**Architecture:** Service 层持有业务逻辑，Route 层只做 HTTP 输入输出，Model 层通过 SQLModel 定义 SQLite schema（后续切 PostgreSQL 只需改 `DATABASE_URL`）。DashScope 调用封装在 `chat_service.py`，通过 `httpx.AsyncClient` 异步调用。

**Tech Stack:** Python 3.12+, FastAPI, SQLModel, pydantic-settings, passlib[bcrypt], httpx, uvicorn, pytest, pytest-asyncio, ruff, mypy

---

## File Map

| 路径 | 职责 |
|---|---|
| `backend/pyproject.toml` | uv 项目配置与依赖 |
| `backend/app/main.py` | FastAPI 入口、路由挂载、静态文件、CORS、启动事件 |
| `backend/app/core/config.py` | pydantic-settings Settings 类 |
| `backend/app/core/logging.py` | 结构化日志配置 |
| `backend/app/core/security.py` | bcrypt hash_password / verify_password |
| `backend/app/db/session.py` | SQLModel engine、get_session 依赖、create_db_and_tables |
| `backend/app/models/models.py` | User、Book SQLModel 表模型 |
| `backend/app/schemas/auth.py` | RegisterRequest、LoginRequest、AuthResponse |
| `backend/app/schemas/books.py` | BookOut、BookListResponse、UploadRequest、BookContentResponse |
| `backend/app/schemas/chat.py` | ChatRequest、ChatResponse |
| `backend/app/schemas/users.py` | UserProfileResponse、UpdateCurrentBookRequest、CurrentBookResponse |
| `backend/app/api/deps.py` | SessionDep 类型别名 |
| `backend/app/api/routes/auth.py` | POST /api/register、POST /api/login |
| `backend/app/api/routes/books.py` | GET /api/books、GET /api/book_content、POST /api/upload |
| `backend/app/api/routes/users.py` | GET /api/user_profile、GET /api/current_book、POST /api/update_current_book |
| `backend/app/api/routes/chat.py` | POST /api/chat |
| `backend/app/services/auth_service.py` | register_user、login_user、seed_default_data |
| `backend/app/services/book_service.py` | get_books、get_book_content、upload_book |
| `backend/app/services/user_service.py` | get_user_profile、get_current_book、update_current_book |
| `backend/app/services/chat_service.py` | build_system_prompt、call_dashscope |
| `backend/tests/conftest.py` | pytest fixtures：engine、session、client |
| `backend/tests/unit/test_security.py` | bcrypt 哈希单元测试 |
| `backend/tests/unit/test_auth_service.py` | 注册、登录、重复用户名单元测试 |
| `backend/tests/unit/test_chat_service.py` | system prompt 构建单元测试 |
| `backend/tests/api/test_auth_routes.py` | /api/register、/api/login 集成测试 |
| `backend/tests/api/test_books_routes.py` | /api/books、/api/upload 集成测试 |

---

## Task 1：初始化项目结构与 pyproject.toml

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py` 及所有子包 `__init__.py`
- Create: `backend/tests/__init__.py` 及子包

- [ ] **Step 1: 创建目录结构**

```bash
cd /Users/qadmlee/cmblab/HuiYi
mkdir -p backend/app/core backend/app/db backend/app/models
mkdir -p backend/app/schemas backend/app/services
mkdir -p backend/app/api/routes
mkdir -p backend/tests/unit backend/tests/api
touch backend/app/__init__.py
touch backend/app/core/__init__.py
touch backend/app/db/__init__.py
touch backend/app/models/__init__.py
touch backend/app/schemas/__init__.py
touch backend/app/services/__init__.py
touch backend/app/api/__init__.py
touch backend/app/api/routes/__init__.py
touch backend/tests/__init__.py
touch backend/tests/unit/__init__.py
touch backend/tests/api/__init__.py
```

- [ ] **Step 2: 创建 pyproject.toml**

创建 `backend/pyproject.toml`：

```toml
[project]
name = "huiyi-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlmodel>=0.0.21",
    "pydantic-settings>=2.4.0",
    "passlib[bcrypt]>=1.7.4",
    "httpx>=0.27.0",
    "python-multipart>=0.0.9",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.27.0",
    "ruff>=0.6.0",
    "mypy>=1.11.0",
]

[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM"]
ignore = []

[tool.mypy]
python_version = "3.12"
strict = true
plugins = ["pydantic.mypy"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 3: 安装依赖**

```bash
cd backend
uv sync --extra dev
```

Expected: 无报错，生成 `.venv/` 和 `uv.lock`

- [ ] **Step 4: 验证安装**

```bash
cd backend
uv run python -c "import fastapi, sqlmodel, passlib; print('OK')"
```

Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "chore(backend): initialize FastAPI project structure with uv"
```

---

## Task 2：配置层 — config、logging、security

**Files:**
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/logging.py`
- Create: `backend/app/core/security.py`
- Create: `backend/tests/unit/test_security.py`

- [ ] **Step 1: 写安全模块测试**

创建 `backend/tests/unit/test_security.py`：

```python
from app.core.security import hash_password, verify_password


def test_hash_password_returns_string() -> None:
    hashed = hash_password("secret123")
    assert isinstance(hashed, str)
    assert hashed != "secret123"


def test_verify_password_correct() -> None:
    hashed = hash_password("my_password")
    assert verify_password("my_password", hashed) is True


def test_verify_password_wrong() -> None:
    hashed = hash_password("correct")
    assert verify_password("wrong", hashed) is False


def test_hash_is_unique() -> None:
    h1 = hash_password("same")
    h2 = hash_password("same")
    # bcrypt 每次生成不同 salt，所以哈希结果不同
    assert h1 != h2
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd backend
uv run pytest tests/unit/test_security.py -v
```

Expected: `ImportError: cannot import name 'hash_password' from 'app.core.security'`

- [ ] **Step 3: 实现 config.py**

创建 `backend/app/core/config.py`：

```python
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    PORT: int = 8000
    DASHSCOPE_API_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./mybook.db"
    ENVIRONMENT: str = "development"

    # 书籍文件存储目录（相对于项目根目录）
    BOOKS_DIR: Path = Path(__file__).parent.parent.parent.parent / "static" / "books"
    STATIC_DIR: Path = Path(__file__).parent.parent.parent.parent / "static"


settings = Settings()
```

- [ ] **Step 4: 实现 logging.py**

创建 `backend/app/core/logging.py`：

```python
import logging
import sys


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )


logger = logging.getLogger("huiyi")
```

- [ ] **Step 5: 实现 security.py**

创建 `backend/app/core/security.py`：

```python
from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)
```

- [ ] **Step 6: 运行测试，确认通过**

```bash
cd backend
uv run pytest tests/unit/test_security.py -v
```

Expected: `4 passed`

- [ ] **Step 7: Commit**

```bash
git add backend/app/core/ backend/tests/unit/test_security.py
git commit -m "feat(backend): add config, logging, and bcrypt security layer"
```

---

## Task 3：数据库层 — SQLModel 模型与 Session

**Files:**
- Create: `backend/app/models/models.py`
- Create: `backend/app/db/session.py`

- [ ] **Step 1: 创建 SQLModel 模型**

创建 `backend/app/models/models.py`：

```python
import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


def _new_uuid() -> str:
    return str(uuid.uuid4())


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=_new_uuid, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    avatar: str = Field(default="default_avatar_1.svg")
    signature: str = Field(default="懂书也懂你")
    current_book_id: Optional[str] = Field(default=None)


class Book(SQLModel, table=True):
    __tablename__ = "books"

    id: str = Field(default_factory=_new_uuid, primary_key=True)
    user_id: str = Field(index=True)
    title: str
    author: str = Field(default="Unknown")
    filepath: str
    progress: int = Field(default=0)
    added_at: datetime = Field(default_factory=datetime.utcnow)
```

- [ ] **Step 2: 创建 session.py**

创建 `backend/app/db/session.py`：

```python
from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite 专用
    echo=False,
)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
```

- [ ] **Step 3: 验证模型可导入**

```bash
cd backend
uv run python -c "from app.models.models import User, Book; from app.db.session import create_db_and_tables; create_db_and_tables(); print('DB OK')"
```

Expected: `DB OK`

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/ backend/app/db/
git commit -m "feat(backend): add SQLModel User/Book models and SQLite session"
```

---

## Task 4：Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/schemas/books.py`
- Create: `backend/app/schemas/chat.py`
- Create: `backend/app/schemas/users.py`

- [ ] **Step 1: 创建 auth schemas**

创建 `backend/app/schemas/auth.py`：

```python
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1)
    signature: str = Field(default="这个人很懒，什么都没写")
    avatar: str = Field(default="default_avatar_1.svg")


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class AuthResponse(BaseModel):
    message: str
    user_id: str
    avatar: str
    signature: str
```

- [ ] **Step 2: 创建 books schemas**

创建 `backend/app/schemas/books.py`：

```python
from pydantic import BaseModel


class BookOut(BaseModel):
    id: str
    title: str
    author: str
    progress: int


class BookListResponse(BaseModel):
    books: list[BookOut]


class UploadRequest(BaseModel):
    user_id: str
    filename: str
    content: str  # Base64 编码
    author: str = "Unknown"


class BookContentResponse(BaseModel):
    title: str
    author: str
    content: str
```

- [ ] **Step 3: 创建 chat schemas**

创建 `backend/app/schemas/chat.py`：

```python
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    user_id: str = ""
    book_context: str = ""


class ChatResponse(BaseModel):
    response: str
```

- [ ] **Step 4: 创建 users schemas**

创建 `backend/app/schemas/users.py`：

```python
from typing import Optional

from pydantic import BaseModel


class UserProfileResponse(BaseModel):
    username: str
    avatar: str
    signature: str


class UpdateCurrentBookRequest(BaseModel):
    user_id: str
    book_id: str


class CurrentBookResponse(BaseModel):
    book_id: Optional[str]
    title: Optional[str] = None
    author: Optional[str] = None
```

- [ ] **Step 5: 验证可导入**

```bash
cd backend
uv run python -c "
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.schemas.books import BookOut, UploadRequest, BookContentResponse
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.users import UserProfileResponse, CurrentBookResponse
print('Schemas OK')
"
```

Expected: `Schemas OK`

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas/
git commit -m "feat(backend): add Pydantic v2 schemas for all API endpoints"
```

---

## Task 5：Service 层 — auth_service

**Files:**
- Create: `backend/app/services/auth_service.py`
- Create: `backend/tests/unit/test_auth_service.py`

- [ ] **Step 1: 写 auth_service 单元测试**

创建 `backend/tests/unit/test_auth_service.py`：

```python
import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from app.core.security import verify_password
from app.models.models import Book, User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import login_user, register_user


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_register_user_creates_user(session: Session) -> None:
    req = RegisterRequest(username="alice", password="testpass")
    response = register_user(req, session)
    assert response.user_id != ""
    assert response.message == "Success"


def test_register_user_hashes_password(session: Session) -> None:
    req = RegisterRequest(username="bob", password="testpass")
    register_user(req, session)
    user = session.exec(select(User).where(User.username == "bob")).first()
    assert user is not None
    assert verify_password("testpass", user.password_hash)


def test_register_user_adds_default_books(session: Session) -> None:
    req = RegisterRequest(username="carol", password="testpass")
    register_user(req, session)
    user = session.exec(select(User).where(User.username == "carol")).first()
    assert user is not None
    books = session.exec(select(Book).where(Book.user_id == user.id)).all()
    assert len(books) >= 1


def test_register_duplicate_username_raises(session: Session) -> None:
    req = RegisterRequest(username="dave", password="testpass")
    register_user(req, session)
    with pytest.raises(ValueError, match="Username taken"):
        register_user(req, session)


def test_login_user_success(session: Session) -> None:
    register_user(RegisterRequest(username="eve", password="testpass"), session)
    response = login_user(LoginRequest(username="eve", password="testpass"), session)
    assert response.user_id != ""
    assert response.message == "Login successful"


def test_login_user_wrong_password_raises(session: Session) -> None:
    register_user(RegisterRequest(username="frank", password="correct"), session)
    with pytest.raises(ValueError, match="Invalid credentials"):
        login_user(LoginRequest(username="frank", password="wrongpass"), session)


def test_login_user_unknown_user_raises(session: Session) -> None:
    with pytest.raises(ValueError, match="Invalid credentials"):
        login_user(LoginRequest(username="ghost", password="anypass"), session)
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd backend
uv run pytest tests/unit/test_auth_service.py -v
```

Expected: `ImportError: cannot import name 'register_user' from 'app.services.auth_service'`

- [ ] **Step 3: 实现 auth_service.py**

创建 `backend/app/services/auth_service.py`：

```python
import logging

from sqlmodel import Session, select

from app.core.security import hash_password, verify_password
from app.models.models import Book, User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest

logger = logging.getLogger("huiyi.auth")

DEFAULT_BOOKS: list[tuple[str, str, str]] = [
    ("红楼梦", "曹雪芹", "cc325b26ff584180bf504bcf50a44514.txt"),
    ("生育制度", "费孝通", "f653423cc7d24a929180bccaf790d219.txt"),
    ("长安的荔枝", "马伯庸", "9180b8ab333f44cabd0c98dd5d9c76be.txt"),
    ("基层女性", "王慧玲", "jicengNvxing.txt"),
]


def _add_default_books(user_id: str, session: Session) -> None:
    for title, author, filename in DEFAULT_BOOKS:
        existing = session.exec(
            select(Book).where(Book.user_id == user_id, Book.filepath == filename)
        ).first()
        if not existing:
            book = Book(user_id=user_id, title=title, author=author, filepath=filename)
            session.add(book)


def register_user(req: RegisterRequest, session: Session) -> AuthResponse:
    existing = session.exec(select(User).where(User.username == req.username)).first()
    if existing:
        raise ValueError("Username taken")

    user = User(
        username=req.username,
        password_hash=hash_password(req.password),
        avatar=req.avatar,
        signature=req.signature,
    )
    session.add(user)
    session.flush()  # 获取 user.id

    _add_default_books(user.id, session)
    session.commit()
    session.refresh(user)

    logger.info("Registered user username=%s", req.username)
    return AuthResponse(
        message="Success",
        user_id=user.id,
        avatar=user.avatar,
        signature=user.signature,
    )


def login_user(req: LoginRequest, session: Session) -> AuthResponse:
    user = session.exec(select(User).where(User.username == req.username)).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise ValueError("Invalid credentials")

    logger.info("Login success username=%s", req.username)
    return AuthResponse(
        message="Login successful",
        user_id=user.id,
        avatar=user.avatar,
        signature=user.signature,
    )


def seed_default_data(session: Session) -> None:
    """首次启动时播种测试用户与默认书目。"""
    count = session.exec(select(User)).all()
    if count:
        return

    test_users = [
        ("test_user_1", "123456", "default_avatar_1.svg", "书山有路勤为径"),
        ("book_lover", "123456", "default_avatar_2.svg", "也就是想读点好书"),
        ("poem_soul", "123456", "default_avatar_3.svg", "生活不只是眼前的苟且"),
    ]
    for username, pw, avatar, signature in test_users:
        user = User(
            username=username,
            password_hash=hash_password(pw),
            avatar=avatar,
            signature=signature,
        )
        session.add(user)
        session.flush()
        _add_default_books(user.id, session)

    session.commit()
    logger.info("Seeded default test users and books")
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd backend
uv run pytest tests/unit/test_auth_service.py -v
```

Expected: `7 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/auth_service.py backend/tests/unit/test_auth_service.py
git commit -m "feat(backend): implement auth_service with bcrypt and default book seeding"
```

---

## Task 6：Service 层 — book_service、user_service

**Files:**
- Create: `backend/app/services/book_service.py`
- Create: `backend/app/services/user_service.py`
- Create: `backend/tests/unit/test_book_service.py`

- [ ] **Step 1: 写 book_service 测试**

创建 `backend/tests/unit/test_book_service.py`：

```python
import base64
from pathlib import Path

import pytest
from sqlmodel import Session, SQLModel, create_engine

from app.schemas.auth import RegisterRequest
from app.schemas.books import UploadRequest
from app.services.auth_service import register_user
from app.services.book_service import get_book_content, get_books, upload_book


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="user_id")
def user_id_fixture(session: Session) -> str:
    resp = register_user(RegisterRequest(username="reader", password="testpass"), session)
    return resp.user_id


def test_get_books_returns_default_books(session: Session, user_id: str) -> None:
    books = get_books(user_id, session)
    assert len(books.books) >= 1


def test_upload_book(session: Session, user_id: str, tmp_path: Path) -> None:
    content = "这是一本测试书籍的内容。"
    encoded = base64.b64encode(content.encode("utf-8")).decode()
    req = UploadRequest(
        user_id=user_id,
        filename="test.txt",
        content=encoded,
        author="测试作者",
    )
    result = upload_book(req, session, books_dir=tmp_path)
    assert result.get("book_id") != ""
    saved_files = list(tmp_path.iterdir())
    assert len(saved_files) == 1
    assert saved_files[0].read_text(encoding="utf-8") == content


def test_get_book_content(session: Session, user_id: str, tmp_path: Path) -> None:
    content = "测试内容"
    encoded = base64.b64encode(content.encode("utf-8")).decode()
    upload_result = upload_book(
        UploadRequest(user_id=user_id, filename="mybook.txt", content=encoded),
        session,
        books_dir=tmp_path,
    )
    book_id = upload_result["book_id"]
    result = get_book_content(book_id, session, books_dir=tmp_path)
    assert result.content == content
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd backend
uv run pytest tests/unit/test_book_service.py -v
```

Expected: `ImportError: cannot import name 'get_books'`

- [ ] **Step 3: 实现 book_service.py**

创建 `backend/app/services/book_service.py`：

```python
import base64
import logging
import uuid
from pathlib import Path

from sqlmodel import Session, select

from app.core.config import settings
from app.models.models import Book
from app.schemas.books import BookContentResponse, BookListResponse, BookOut, UploadRequest

logger = logging.getLogger("huiyi.books")


def get_books(user_id: str, session: Session) -> BookListResponse:
    books = session.exec(
        select(Book).where(Book.user_id == user_id).order_by(Book.added_at.desc())
    ).all()
    return BookListResponse(
        books=[BookOut(id=b.id, title=b.title, author=b.author, progress=b.progress) for b in books]
    )


def get_book_content(
    book_id: str,
    session: Session,
    books_dir: Path | None = None,
) -> BookContentResponse:
    book = session.get(Book, book_id)
    if not book:
        raise LookupError(f"Book not found: {book_id}")

    bdir = books_dir if books_dir is not None else settings.BOOKS_DIR
    full_path = bdir / book.filepath

    try:
        content = full_path.read_text(encoding="utf-8")
    except OSError as exc:
        raise OSError(f"Cannot read book file: {full_path}") from exc

    return BookContentResponse(title=book.title, author=book.author, content=content)


def upload_book(
    req: UploadRequest,
    session: Session,
    books_dir: Path | None = None,
) -> dict[str, str]:
    bdir = books_dir if books_dir is not None else settings.BOOKS_DIR
    bdir.mkdir(parents=True, exist_ok=True)

    raw_content = req.content
    if "," in raw_content:
        raw_content = raw_content.split(",", 1)[1]

    file_bytes = base64.b64decode(raw_content)
    safe_filename = f"{uuid.uuid4().hex}_{req.filename}"
    file_path = bdir / safe_filename
    file_path.write_bytes(file_bytes)

    title = Path(req.filename).stem
    book = Book(user_id=req.user_id, title=title, author=req.author, filepath=safe_filename)
    session.add(book)
    session.commit()
    session.refresh(book)

    logger.info("Uploaded book title=%s user_id=%s", title, req.user_id)
    return {"message": "Upload successful", "book_id": book.id}
```

- [ ] **Step 4: 实现 user_service.py**

创建 `backend/app/services/user_service.py`：

```python
import logging

from sqlmodel import Session, select

from app.models.models import Book, User
from app.schemas.users import CurrentBookResponse, UpdateCurrentBookRequest, UserProfileResponse

logger = logging.getLogger("huiyi.users")


def get_user_profile(user_id: str, session: Session) -> UserProfileResponse:
    user = session.get(User, user_id)
    if not user:
        raise LookupError(f"User not found: {user_id}")
    return UserProfileResponse(
        username=user.username,
        avatar=user.avatar or "default_avatar_1.svg",
        signature=user.signature or "懂书也懂你",
    )


def get_current_book(user_id: str, session: Session) -> CurrentBookResponse:
    user = session.get(User, user_id)
    if not user:
        raise LookupError(f"User not found: {user_id}")

    book_id = user.current_book_id
    if not book_id:
        book = session.exec(
            select(Book).where(Book.user_id == user_id).order_by(Book.added_at.desc())
        ).first()
        if book:
            return CurrentBookResponse(book_id=book.id, title=book.title, author=book.author)
        return CurrentBookResponse(book_id=None)

    book = session.get(Book, book_id)
    if not book:
        return CurrentBookResponse(book_id=None)
    return CurrentBookResponse(book_id=book.id, title=book.title, author=book.author)


def update_current_book(req: UpdateCurrentBookRequest, session: Session) -> dict[str, bool]:
    user = session.get(User, req.user_id)
    if not user:
        raise LookupError(f"User not found: {req.user_id}")
    user.current_book_id = req.book_id
    session.add(user)
    session.commit()
    logger.info("Updated current book user_id=%s book_id=%s", req.user_id, req.book_id)
    return {"success": True}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
cd backend
uv run pytest tests/unit/test_book_service.py -v
```

Expected: `3 passed`

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/book_service.py backend/app/services/user_service.py backend/tests/unit/test_book_service.py
git commit -m "feat(backend): implement book_service and user_service"
```

---

## Task 7：Service 层 — chat_service

**Files:**
- Create: `backend/app/services/chat_service.py`
- Create: `backend/tests/unit/test_chat_service.py`

- [ ] **Step 1: 写 chat_service 测试**

创建 `backend/tests/unit/test_chat_service.py`：

```python
from app.services.chat_service import build_system_prompt

BOOKS = [("红楼梦", "曹雪芹"), ("长安的荔枝", "马伯庸")]


def test_build_system_prompt_contains_base() -> None:
    prompt = build_system_prompt(books=[], book_context="")
    assert "会意" in prompt


def test_build_system_prompt_includes_book_list() -> None:
    prompt = build_system_prompt(books=BOOKS, book_context="")
    assert "红楼梦" in prompt
    assert "曹雪芹" in prompt


def test_build_system_prompt_includes_book_context() -> None:
    ctx = "宝玉见黛玉哭泣，心中难受。"
    prompt = build_system_prompt(books=[], book_context=ctx)
    assert ctx in prompt


def test_build_system_prompt_truncates_long_context() -> None:
    long_ctx = "x" * 10000
    prompt = build_system_prompt(books=[], book_context=long_ctx)
    # context 最多嵌入 5000 字
    assert len(prompt) < 8000
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd backend
uv run pytest tests/unit/test_chat_service.py -v
```

Expected: `ImportError: cannot import name 'build_system_prompt'`

- [ ] **Step 3: 实现 chat_service.py**

创建 `backend/app/services/chat_service.py`：

```python
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("huiyi.chat")

_BASE_SYSTEM_PROMPT = """你叫"会意"，是用户的知心阅读书友。你的回复要温暖、有深度、富有同理心。

【核心原则】
1. 如果用户问到他书架里有的书，请结合你对这本书的了解进行深度分析和讨论。
2. 如果用户问到他书架里没有的书，请凭借你丰富的知识储备，详细介绍这本书的内容、作者背景、核心思想，并给出你的阅读感受和推荐理由。
3. 你可以主动推荐相关书籍，帮助用户拓展阅读视野。
4. 【语气基调】你是用户无话不谈的知心老友，语气要温柔、温暖、富有同理心。
5. 【重要】绝对禁止使用括号来描写动作、神态、场景或补充评论。
6. 引用书原文时，直接融入句子中，不要单独放在末尾的括号里。

"""

_DASHSCOPE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
_MODEL = "qwen-flash-character"
_CONTEXT_MAX_CHARS = 5000


def build_system_prompt(
    books: list[tuple[str, str]],
    book_context: str,
) -> str:
    prompt = _BASE_SYSTEM_PROMPT

    if books:
        book_list = ", ".join(f"《{title}》({author})" for title, author in books)
        prompt += f"\n\n你的用户目前藏书有：{book_list}。请在回答中适时关联这些书的内容，分析用户的阅读口味。"

    if book_context:
        snippet = book_context[:_CONTEXT_MAX_CHARS]
        prompt += (
            f"\n\n用户正在阅读以下内容（节选）：\n{snippet}\n\n"
            "请结合这段内容回答用户的问题。"
        )
    else:
        prompt += "结合用户提到的书本内容进行回应。"

    return prompt


async def call_dashscope(message: str, system_prompt: str) -> str:
    if not settings.DASHSCOPE_API_KEY:
        return "AI 功能未配置（缺少 DASHSCOPE_API_KEY）"

    payload = {
        "model": _MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.DASHSCOPE_API_KEY}",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(_DASHSCOPE_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return str(data["choices"][0]["message"]["content"])
    except httpx.HTTPStatusError as exc:
        logger.error("DashScope HTTP error status=%s", exc.response.status_code)
        return f"AI 服务异常: {exc.response.status_code}"
    except (KeyError, IndexError):
        logger.error("DashScope unexpected response structure")
        return "AI 返回结构异常"
    except httpx.RequestError as exc:
        logger.error("DashScope connection error: %s", exc)
        return "AI 连接中断"
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd backend
uv run pytest tests/unit/test_chat_service.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/chat_service.py backend/tests/unit/test_chat_service.py
git commit -m "feat(backend): implement chat_service with async httpx DashScope client"
```

---

## Task 8：API 路由层

**Files:**
- Create: `backend/app/api/deps.py`
- Create: `backend/app/api/routes/auth.py`
- Create: `backend/app/api/routes/books.py`
- Create: `backend/app/api/routes/users.py`
- Create: `backend/app/api/routes/chat.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/api/test_auth_routes.py`
- Create: `backend/tests/api/test_books_routes.py`

- [ ] **Step 1: 创建 deps.py**

创建 `backend/app/api/deps.py`：

```python
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.db.session import get_session

SessionDep = Annotated[Session, Depends(get_session)]
```

- [ ] **Step 2: 创建 auth 路由**

创建 `backend/app/api/routes/auth.py`：

```python
from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, session: SessionDep) -> AuthResponse:
    try:
        return auth_service.register_user(req, session)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, session: SessionDep) -> AuthResponse:
    try:
        return auth_service.login_user(req, session)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
```

- [ ] **Step 3: 创建 books 路由**

创建 `backend/app/api/routes/books.py`：

```python
from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.schemas.books import BookContentResponse, BookListResponse, UploadRequest
from app.services import book_service

router = APIRouter()


@router.get("/books", response_model=BookListResponse)
def list_books(user_id: str, session: SessionDep) -> BookListResponse:
    return book_service.get_books(user_id, session)


@router.get("/book_content", response_model=BookContentResponse)
def book_content(book_id: str, session: SessionDep) -> BookContentResponse:
    try:
        return book_service.get_book_content(book_id, session)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/upload")
def upload(req: UploadRequest, session: SessionDep) -> dict[str, str]:
    return book_service.upload_book(req, session)
```

- [ ] **Step 4: 创建 users 路由**

创建 `backend/app/api/routes/users.py`：

```python
from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.schemas.users import CurrentBookResponse, UpdateCurrentBookRequest, UserProfileResponse
from app.services import user_service

router = APIRouter()


@router.get("/user_profile", response_model=UserProfileResponse)
def user_profile(user_id: str, session: SessionDep) -> UserProfileResponse:
    try:
        return user_service.get_user_profile(user_id, session)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/current_book", response_model=CurrentBookResponse)
def current_book(user_id: str, session: SessionDep) -> CurrentBookResponse:
    try:
        return user_service.get_current_book(user_id, session)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/update_current_book")
def update_current_book(req: UpdateCurrentBookRequest, session: SessionDep) -> dict[str, bool]:
    try:
        return user_service.update_current_book(req, session)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
```

- [ ] **Step 5: 创建 chat 路由**

创建 `backend/app/api/routes/chat.py`：

```python
from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import SessionDep
from app.models.models import Book
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import build_system_prompt, call_dashscope

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, session: SessionDep) -> ChatResponse:
    books: list[tuple[str, str]] = []
    if req.user_id:
        db_books = session.exec(
            select(Book).where(Book.user_id == req.user_id).order_by(Book.added_at.desc())
        ).all()
        books = [(b.title, b.author) for b in db_books]

    system_prompt = build_system_prompt(books=books, book_context=req.book_context)
    response_text = await call_dashscope(req.message, system_prompt)
    return ChatResponse(response=response_text)
```

- [ ] **Step 6: 创建 pytest conftest（在 main.py 之后完成）**

注意：conftest 需要 `app.main` 存在。先创建文件，等 Task 9 完成后再运行。

创建 `backend/tests/conftest.py`：

```python
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.db.session import get_session
from app.main import app


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
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
```

- [ ] **Step 7: 写 auth 路由集成测试**

创建 `backend/tests/api/test_auth_routes.py`：

```python
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
```

- [ ] **Step 8: 写 books 路由集成测试**

创建 `backend/tests/api/test_books_routes.py`：

```python
import base64

from fastapi.testclient import TestClient


def _register_and_get_user_id(client: TestClient, username: str = "reader") -> str:
    resp = client.post("/api/register", json={"username": username, "password": "testpass"})
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
    resp = client.post("/api/upload", json={
        "user_id": user_id,
        "filename": "test.txt",
        "content": content,
        "author": "作者",
    })
    assert resp.status_code == 200
    assert "book_id" in resp.json()
```

- [ ] **Step 9: Commit（routes + tests，等 main.py 后再运行测试）**

```bash
git add backend/app/api/ backend/tests/
git commit -m "feat(backend): add FastAPI routes for auth, books, users, chat"
```

---

## Task 9：FastAPI 入口 main.py

**Files:**
- Create: `backend/app/main.py`

- [ ] **Step 1: 创建 main.py**

创建 `backend/app/main.py`：

```python
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session

from app.api.routes import auth, books, chat, users
from app.core.config import settings
from app.core.logging import setup_logging
from app.db.session import create_db_and_tables, engine
from app.services.auth_service import seed_default_data

# 项目根目录（backend/ 的上一级）
PROJECT_ROOT = Path(__file__).parent.parent.parent

PAGE_MAP: dict[str, str] = {
    "login": "login.html",
    "bookshelf": "bookshelf.html",
    "reader": "reader.html",
    "chat": "chat.html",
    "notes": "notes.html",
    "profile": "profile.html",
}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging()
    create_db_and_tables()
    with Session(engine) as session:
        seed_default_data(session)
    yield


app = FastAPI(title="会意 Huiyi API", lifespan=lifespan)

# CORS
_origins = (
    ["*"]
    if settings.ENVIRONMENT == "development"
    else []  # 生产环境在此填写实际域名
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 路由
app.include_router(auth.router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

# 静态文件（avatars、books、tailwind.js 等）
_static_dir = PROJECT_ROOT / "static"
if _static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")


@app.get("/")
def root() -> RedirectResponse:
    return RedirectResponse(url="/login")


@app.get("/{page}")
def serve_page(page: str) -> FileResponse | RedirectResponse:
    filename = PAGE_MAP.get(page)
    if not filename:
        return RedirectResponse(url="/login")
    path = PROJECT_ROOT / filename
    if path.exists():
        return FileResponse(str(path))
    return RedirectResponse(url="/login")
```

- [ ] **Step 2: 运行全部测试**

```bash
cd backend
uv run pytest -v
```

Expected: 全部通过（`test_security` 4 + `test_auth_service` 7 + `test_book_service` 3 + `test_chat_service` 4 + `test_auth_routes` 5 + `test_books_routes` 2 = 25 passed）

- [ ] **Step 3: 启动开发服务器**

```bash
cd backend
uv run fastapi dev app/main.py --port 8000
```

浏览器打开 http://localhost:8000，应自动跳转 `/login`，登录页正常显示。

- [ ] **Step 4: Commit**

```bash
git add backend/app/main.py
git commit -m "feat(backend): wire up FastAPI app with lifespan, CORS, static files, and page serving"
```

---

## Task 10：Auto Gate — lint、类型检查、全量测试

**Files:** 无新文件，修复所有 lint/type 报错

- [ ] **Step 1: Ruff format**

```bash
cd backend
uv run ruff format --check .
# 有问题则：uv run ruff format .
```

- [ ] **Step 2: Ruff lint**

```bash
cd backend
uv run ruff check .
# 有问题则：uv run ruff check --fix .
```

修复后重新运行直到 0 错误。

- [ ] **Step 3: Mypy**

```bash
cd backend
uv run mypy app
```

修复所有类型错误后重新运行，直到 0 errors。

- [ ] **Step 4: 全量测试**

```bash
cd backend
uv run pytest --tb=short -v
```

Expected: 所有测试 pass，0 failures。

- [ ] **Step 5: 归档旧后端**

```bash
cd /Users/qadmlee/cmblab/HuiYi
mv run_app.py run_app_legacy.py
mv main_old.py main_old_legacy.py 2>/dev/null || true
```

- [ ] **Step 6: 更新部署配置**

修改 `Procfile`：
```
web: cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

修改 `render.yaml` 的 `startCommand`：
```yaml
startCommand: cd backend && pip install uv && uv sync && uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- [ ] **Step 7: 最终 commit**

```bash
git add -A
git commit -m "refactor(backend): complete migration to FastAPI + SQLModel + bcrypt

- Replace http.server with FastAPI + uvicorn
- Replace SHA256 with bcrypt password hashing (passlib)
- Add pydantic-settings config management (no bare os.environ)
- Add structured logging (no print statements)
- Add specific exception handling (no bare except Exception)
- Add SQLModel ORM layer (SQLite, ready for PostgreSQL migration)
- Add full test suite: 25 tests across unit + API integration
- Pass ruff format, ruff lint, mypy, pytest Auto Gate"
```

---

## 验收清单

```
[ ] uv run ruff format --check .  → 0 issues
[ ] uv run ruff check .           → 0 issues
[ ] uv run mypy app               → 0 errors
[ ] uv run pytest -v              → 25 passed, 0 failed
[ ] 启动服务器，浏览器访问 /login  → 正常显示
[ ] POST /api/login               → 返回 user_id
[ ] GET /api/books?user_id=xxx    → 返回书架列表
```
