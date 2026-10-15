"""Environment-based configuration, independent of the working directory."""

from pathlib import Path

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
    cors_origins: list[str] = ["http://127.0.0.1:5173", "http://localhost:5173"]

    @property
    def debug_ui_enabled(self) -> bool:
        return self.app_env == "development" and self.sql_debug_ui


settings = Settings()
