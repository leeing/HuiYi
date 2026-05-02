from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session

from app.api.routes import auth, books, chat, users
from app.core.config import settings
from app.core.logging import setup_logging
from app.db.session import create_db_and_tables, engine
from app.services.auth_service import seed_default_data

# Directories (resolved relative to this file's location)
_BACKEND_DIR = Path(__file__).parent.parent  # backend/
PROJECT_ROOT = _BACKEND_DIR.parent  # project root

# React SPA build output
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

# Legacy static files (avatars, uploaded books)
_STATIC_DIR = PROJECT_ROOT / "static"


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

# API routes (must be registered BEFORE static mounts and SPA fallback)
app.include_router(auth.router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

# Legacy static files (avatars, uploaded book txt files)
if _STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")

# React SPA assets (JS/CSS chunks from Vite build)
_assets_dir = FRONTEND_DIST / "assets"
if _assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(_assets_dir)), name="assets")


# SPA fallback — must be LAST
@app.get("/{full_path:path}", response_class=HTMLResponse)
def spa_fallback(full_path: str) -> FileResponse:
    """Return index.html for all non-API paths (React Router handles routing)."""
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(str(index))
    # Graceful degradation when frontend is not built
    raise HTTPException(
        status_code=503,
        detail="Frontend not built — run: cd frontend && pnpm build",
    )
