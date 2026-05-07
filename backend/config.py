from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(BASE_DIR / '.env', BASE_DIR / '.env.local'),
        env_file_encoding='utf-8',
        extra='ignore',
    )

    app_name: str = "Agentic Components Backend"
    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    postgres_dsn: str = (
        "postgresql+asyncpg://behavior_user:behavior_pass@localhost:5432/behavior"
    )
    db_auto_create: bool = True

    jwt_secret: str = "replace-with-a-long-random-secret"
    jwt_algorithm: str = "HS256"

    auth_bridge_secret: str = "replace-with-a-shared-bridge-secret"
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_storage_bucket: str = "agentic-components"
    dashscope_api_key: str | None = None
    dashscope_api_keys: str | None = None
    qwen_model: str = "qwen-plus"
    qwen_api_url: str = (
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        return [item.strip() for item in value.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
