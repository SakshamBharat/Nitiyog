from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PYTHON_ROOT = Path(__file__).resolve().parent


class Settings(BaseSettings):
    gemini_api_key: str | None = Field(default=None, validation_alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-3.8-flash", validation_alias="GEMINI_MODEL")
    gemini_fallback_model: str = Field(default="gemini-3.6-flash", validation_alias="GEMINI_FALLBACK_MODEL")
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        validation_alias="CORS_ORIGINS",
    )

    @field_validator("gemini_api_key", mode="before")
    @classmethod
    def ignore_placeholder_key(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        if not cleaned or cleaned.startswith("your_"):
            return None
        return cleaned

    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env", PYTHON_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
