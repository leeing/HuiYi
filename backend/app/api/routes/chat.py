from fastapi import APIRouter

from app.api.deps import SessionDep
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import get_chat_response

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, session: SessionDep) -> ChatResponse:
    response_text = await get_chat_response(
        message=req.message,
        user_id=req.user_id,
        book_context=req.book_context,
        session=session,
    )
    return ChatResponse(response=response_text)
