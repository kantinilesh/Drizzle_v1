"""
Drizzle — Parametric Insurance for Gig Workers
================================================
Main FastAPI application entry point.
Single service with multiple routers, designed for Render deployment.

Run locally:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Deploy on Render:
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
"""

import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db
from app.mcp.mcp_client import check_mcp_health

# Import all routers
from app.routers import auth, workers, policies, claims, risk, notifications
from app.routers.admin import (
    admin_dashboard, admin_workers, admin_policies,
    admin_claims, admin_fraud, admin_config,
)

# ─────────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  [%(name)s]  %(message)s",
)
log = logging.getLogger("drizzle.main")


# ─────────────────────────────────────────────────────────────────
# LIFECYCLE
# ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    log.info("="*60)
    log.info("  DRIZZLE — Parametric Insurance for Gig Workers")
    log.info("="*60)
    log.info("Starting up...")

    # Initialize database tables
    try:
        await init_db()
        log.info("✅ Database initialized")

        # Seed default system config values
        try:
            from app.core.database import async_session
            from app.models.models import SystemConfig
            from sqlalchemy import select
            async with async_session() as session:
                for key, value in [("claim_threshold", "0.5"), ("fraud_threshold", "0.3")]:
                    result = await session.execute(select(SystemConfig).where(SystemConfig.key == key))
                    if not result.scalar_one_or_none():
                        session.add(SystemConfig(key=key, value=value))
                await session.commit()
                log.info("✅ System config seeded")
        except Exception as e:
            log.warning(f"Config seeding skipped: {e}")
    except Exception as e:
        log.error(f"❌ Database initialization failed: {e}")

    # Check MCP server availability
    try:
        mcp_status = await check_mcp_health()
        for name, status_val in mcp_status.items():
            icon = "✅" if status_val == "ok" else "⚠️"
            log.info(f"{icon} MCP {name}: {status_val}")
    except Exception as e:
        log.warning(f"MCP health check failed: {e}")

    log.info(f"🚀 Server ready on port {settings.PORT}")
    log.info("-"*60)

    yield

    log.info("Shutting down...")
    await close_db()
    log.info("Goodbye!")


# ─────────────────────────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Drizzle API",
    description=(
        "Parametric Insurance for Gig Workers — "
        "Automatic claim processing powered by real-time risk signals "
        "from weather, traffic, and social disruption data."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(workers.router)
app.include_router(policies.router)
app.include_router(claims.router)
app.include_router(risk.router)
app.include_router(notifications.router)

# Admin routers
app.include_router(admin_dashboard.router)
app.include_router(admin_workers.router)
app.include_router(admin_policies.router)
app.include_router(admin_claims.router)
app.include_router(admin_fraud.router)
app.include_router(admin_config.router)


# ─────────────────────────────────────────────────────────────────
# ROOT & HEALTH ENDPOINTS
# ─────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """API landing page with available endpoints."""
    return {
        "service": "Drizzle — Parametric Insurance for Gig Workers",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "auth": {
                "POST /auth/signup": "Create a new account",
                "POST /auth/login": "Login with email + password",
                "GET /auth/me": "Get current user profile",
            },
            "workers": {
                "POST /workers/profile": "Create/update worker profile",
                "GET /workers/me": "Get worker profile",
            },
            "policies": {
                "POST /policies/calculate": "Calculate premium estimate",
                "POST /policies/create": "Create a new policy",
                "GET /policies/my": "Get all my policies",
                "GET /policies/{id}": "Get policy by ID",
            },
            "claims": {
                "POST /claims/trigger": "Trigger a claim assessment",
                "GET /claims/my": "Get all my claims",
                "GET /claims/{id}": "Get claim by ID",
            },
            "risk": {
                "GET /risk/live": "Get live risk assessment from MCP servers",
            },
            "notifications": {
                "GET /notifications": "Get all notifications",
                "POST /notifications/read/{id}": "Mark notification as read",
            },
            "admin": {
                "GET /admin/dashboard": "Admin control tower",
                "GET /admin/workers": "List all workers",
                "GET /admin/workers/{id}": "Worker detail + policies + claims",
                "GET /admin/policies": "List all policies",
                "POST /admin/policies/create": "Admin creates policy",
                "GET /admin/claims": "List all claims",
                "GET /admin/claims/{id}": "Claim detail + reasoning + fraud",
                "POST /admin/claims/{id}/review": "Approve/reject claim",
                "GET /admin/fraud-alerts": "Fraud alerts",
                "POST /admin/fraud-alerts/{id}/resolve": "Resolve alert",
                "GET /admin/risk": "Zone-level risk",
                "GET /admin/config": "System config",
                "PUT /admin/config": "Update config",
                "GET /admin/analytics": "Analytics overview",
                "GET /admin/notifications": "Admin notifications",
                "GET /admin/audit-logs": "Audit trail",
            },
        },
    }


@app.get("/health")
async def health():
    """Health check endpoint for Render and monitoring."""
    # Check database
    db_status = "unknown"
    try:
        from app.core.database import engine
        async with engine.connect() as conn:
            await conn.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)[:100]}"

    # Check MCP servers
    try:
        mcp_status = await check_mcp_health()
    except Exception:
        mcp_status = {"weather": "unknown", "traffic": "unknown", "social": "unknown"}

    return {
        "status": "ok",
        "version": "1.0.0",
        "database": db_status,
        "mcp_servers": mcp_status,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
