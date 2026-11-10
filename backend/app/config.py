"""Environment-based configuration, independent of the working directory."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite:///data/prototype.db"
    app_env: str = "development"
    sql_echo: bool = False
    sql_debug_ui: bool = False
    session_hours: int = Field(default=168, ge=1, le=720)
    session_cookie_secure: bool = False
    waf_enabled: bool = True
    waf_requests_per_minute: int = Field(default=180, ge=10, le=10_000)
    waf_strike_limit: int = Field(default=5, ge=1, le=100)
    waf_strike_window_seconds: int = Field(default=300, ge=10, le=3600)
    waf_ban_seconds: int = Field(default=300, ge=1, le=86_400)
    waf_max_body_bytes: int = Field(default=65_536, ge=1024, le=1_048_576)
    cors_origins: list[str] = ["http://127.0.0.1:5173", "http://localhost:5173"]

    @property
    def debug_ui_enabled(self) -> bool:
        return self.app_env == "development" and self.sql_debug_ui


settings = Settings()
