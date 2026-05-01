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
