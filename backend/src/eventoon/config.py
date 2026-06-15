from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = Field(...)
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8081"
    NVIDIA_API_KEY: str | None = None
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_MODEL: str = "meta/llama-3.1-8b-instruct"

    model_config = {
        "env_file": (
            ".env",
            str(Path(__file__).resolve().parent.parent.parent.parent / ".env"),
        ),
        "env_file_encoding": "utf-8",
        "extra": "allow",
    }


settings = Settings()
