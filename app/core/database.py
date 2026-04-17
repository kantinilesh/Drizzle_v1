"""
Async Database Engine + Session Factory (SQLAlchemy 2.0 async).
Supports both PostgreSQL (asyncpg) and SQLite (aiosqlite) backends.
"""

import logging
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

log = logging.getLogger("drizzle.db")

# ── Engine ────────────────────────────────────────────────────────
_is_sqlite = settings.is_sqlite

if _is_sqlite:
    log.info("🗄️  Using SQLite (local dev): drizzle_local.db")
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False},
    )
else:
    _url = settings.DATABASE_URL
    _masked = _url.split("@")[-1] if "@" in _url else _url[:40]
    log.info(f"🐘  Using PostgreSQL @ {_masked}")

    # Supabase uses PgBouncer transaction-mode pooler.
    # asyncpg does NOT support ?sslmode= in the URL — it must go in connect_args.
    # Also disable prepared statement cache (incompatible with PgBouncer).
    import ssl as _ssl
    _ssl_ctx = _ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = _ssl.CERT_NONE

    _connect_args = {
        "ssl": _ssl_ctx,                        # SSL for Supabase
        "statement_cache_size": 0,              # Required for PgBouncer
        "prepared_statement_cache_size": 0,
    }

    # Strip ?sslmode from URL if present (asyncpg rejects it)
    if "sslmode" in _url:
        from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
        _parsed = urlparse(_url)
        _qs = {k: v for k, v in parse_qs(_parsed.query).items() if k != "sslmode"}
        _url = urlunparse(_parsed._replace(query=urlencode(_qs, doseq=True)))

    engine = create_async_engine(
        _url,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args=_connect_args,
    )

# ── Session factory ──────────────────────────────────────────────
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Base class for all ORM models ────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Dependency for FastAPI ───────────────────────────────────────
async def get_db() -> AsyncSession:
    """Yield a transactional async session, auto-close on exit."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Lifecycle helpers ────────────────────────────────────────────
async def init_db():
    """Create all tables from ORM metadata (dev convenience)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("Database tables ensured.")


async def close_db():
    """Dispose engine pool."""
    await engine.dispose()
    log.info("Database connection pool closed.")
