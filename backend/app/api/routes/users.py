from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.schemas.users import (
    CurrentBookResponse,
    UpdateCurrentBookRequest,
    UserProfileResponse,
)
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
def update_current_book(
    req: UpdateCurrentBookRequest, session: SessionDep
) -> dict[str, bool]:
    try:
        return user_service.update_current_book(req, session)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
