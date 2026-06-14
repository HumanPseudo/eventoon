from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = Field(
        default="postgresql+asyncpg://eventoon:eventoon@localhost:5432/eventoon",
        alias="DATABASE_URL",
    )
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")
    nvidia_api_key: str | None = Field(default=None, alias="NVIDIA_API_KEY")
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "meta/llama-3.1-8b-instruct"

    model_config = {
        "env_file": (
            ".env",
            str(Path(__file__).resolve().parent.parent.parent.parent / ".env"),
        ),
        "env_file_encoding": "utf-8",
        "extra": "allow",
    }


settings = Settings()
