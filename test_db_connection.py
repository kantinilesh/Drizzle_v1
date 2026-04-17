#!/usr/bin/env python3
"""
Drizzle — Supabase Connection Test
Run: python test_db_connection.py
"""

import asyncio
import os
import ssl
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from dotenv import load_dotenv
load_dotenv(override=True)


async def test_connection():
    raw_url = os.getenv("DATABASE_URL", "")

    if not raw_url:
        raw_url = "sqlite+aiosqlite:///./drizzle_local.db"

    is_sqlite  = raw_url.startswith("sqlite")
    is_supabase = "supabase" in raw_url

    print(f"\n{'='*55}")
    print(f"  DRIZZLE — Database Connection Test")
    print(f"{'='*55}")

    if is_sqlite:
        print(f"📁 Type  : SQLite (local dev) — NOT Supabase")
        print(f"📍 File  : drizzle_local.db")
    elif is_supabase:
        host = raw_url.split("@")[-1].split("/")[0] if "@" in raw_url else "?"
        print(f"🌐 Type  : Supabase (PostgreSQL)")
        print(f"📍 Host  : {host}")
    else:
        print(f"🐘 Type  : PostgreSQL")

    print(f"\n{'─'*55}")
    print(f"  Testing connection...")
    print(f"{'─'*55}")

    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy import text

        if is_sqlite:
            engine = create_async_engine(raw_url, connect_args={"check_same_thread": False})
        else:
            # asyncpg requires SSL in connect_args, NOT as ?sslmode= in the URL
            ssl_ctx = ssl.create_default_context()
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl.CERT_NONE

            # Strip ?sslmode param if present
            connect_url = raw_url
            if "sslmode" in connect_url:
                parsed = urlparse(connect_url)
                qs = {k: v for k, v in parse_qs(parsed.query).items() if k != "sslmode"}
                connect_url = urlunparse(parsed._replace(query=urlencode(qs, doseq=True)))

            engine = create_async_engine(
                connect_url,
                pool_pre_ping=True,
                connect_args={
                    "ssl": ssl_ctx,
                    "statement_cache_size": 0,
                    "prepared_statement_cache_size": 0,
                },
            )

        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print(f"✅ Connection: SUCCESS!")

            # List tables
            if is_sqlite:
                q = await conn.execute(
                    text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
                )
            else:
                q = await conn.execute(
                    text("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
                )
            tables = [r[0] for r in q.fetchall()]

            if tables:
                print(f"📋 Tables ({len(tables)}):")
                for t in tables:
                    print(f"   → {t}")
            else:
                print(f"📋 Tables: (empty — will be auto-created on first server start)")

        await engine.dispose()

    except Exception as e:
        print(f"❌ Connection FAILED: {e}")
        if is_supabase:
            print(f"\n  Try the Session-mode URL (port 5432 instead of 6543)")
        import sys
        sys.exit(1)

    print(f"{'='*55}\n")


if __name__ == "__main__":
    asyncio.run(test_connection())
