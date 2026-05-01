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

# Project root (one level above backend/)
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
    else []  # Add production domains here
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(auth.router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

# Static files (avatars, books, tailwind.js)
_static_dir = PROJECT_ROOT / "static"
if _static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")


@app.get("/")
def root() -> RedirectResponse:
    return RedirectResponse(url="/login")


@app.get("/{page}", response_model=None)
def serve_page(page: str) -> FileResponse | RedirectResponse:
    filename = PAGE_MAP.get(page)
    if not filename:
        return RedirectResponse(url="/login")
    path = PROJECT_ROOT / filename
    if path.exists():
        return FileResponse(str(path))
    return RedirectResponse(url="/login")
