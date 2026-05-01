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
