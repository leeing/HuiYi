from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    user_id: str = ""
    book_context: str = ""


class ChatResponse(BaseModel):
    response: str
