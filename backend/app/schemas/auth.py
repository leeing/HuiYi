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
