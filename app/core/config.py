"""
Configuration — loads .env and exposes typed settings.
"""

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Keep explicit shell / deployment environment variables higher priority than .env.
load_dotenv(override=False)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Database ──────────────────────────────────────────────────
    # Priority order for DATABASE_URL:
    # 1. DATABASE_URL env var (direct, e.g. from Render/Railway)
    # 2. SUPABASE_DB_URL (Supabase direct connection string)
    # 3. Falls back to local SQLite for development
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        os.getenv(
            "SUPABASE_DB_URL",
            "sqlite+aiosqlite:///./drizzle_local.db"  # local dev fallback
        )
    )

    # ── Supabase (for reference) ─────────────────────────────────
    SUPABASE_URL: str = os.getenv(
        "NEXT_PUBLIC_SUPABASE_URL",
        os.getenv("SUPABASE_URL", "")
    )
    SUPABASE_KEY: str = os.getenv(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
    )

    # ── JWT Auth ─────────────────────────────────────────────────
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY", "drizzle-super-secret-key-change-in-production"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_HOURS: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

    # ── API Keys ─────────────────────────────────────────────────
    WEATHERAPI_KEY: str = os.getenv("WEATHERAPI_KEY", "")
    TOMTOM_API_KEY: str = os.getenv("TOMTOM_API_KEY", "")
    NEWSAPI_KEY: str = os.getenv("NEWSAPI_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # ── MCP Server URLs ─────────────────────────────────────────
    WEATHER_MCP_URL: str = os.getenv(
        "WEATHER_MCP_URL", "http://127.0.0.1:8001/score"
    )
    TRAFFIC_MCP_URL: str = os.getenv(
        "TRAFFIC_MCP_URL", "http://127.0.0.1:8002/score"
    )
    SOCIAL_MCP_URL: str = os.getenv(
        "SOCIAL_MCP_URL", "http://127.0.0.1:8003/score"
    )

    # ── Server ───────────────────────────────────────────────────
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def is_supabase(self) -> bool:
        return "supabase" in self.DATABASE_URL

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
