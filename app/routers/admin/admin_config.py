"""
Admin Config Router — GET/PUT /admin/config, GET /admin/analytics,
                      GET /admin/notifications, POST /admin/notifications/read/{id},
                      GET /admin/audit-logs
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.models.models import SystemConfig, AuditLog, AdminNotification
from app.schemas.admin_schemas import SystemConfigUpdate
from app.services.admin.admin_analytics_service import AdminAnalyticsService

log = logging.getLogger("drizzle.admin.config")

router = APIRouter(prefix="/admin", tags=["Admin Config & Analytics"])


# ── SYSTEM CONFIG ────────────────────────────────────────────────

@router.get("/config")
async def get_config(
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get all system configuration values."""
    result = await db.execute(select(SystemConfig).order_by(SystemConfig.key))
    configs = result.scalars().all()
    return [
        {"key": c.key, "value": c.value, "updated_at": c.updated_at.isoformat() if c.updated_at else None}
        for c in configs
    ]


@router.put("/config")
async def update_config(
    req: SystemConfigUpdate,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update system config values (claim_threshold, fraud_threshold, etc.)."""
    updated = []
    for item in req.configs:
        key = item.get("key")
        value = item.get("value")
        if not key:
            continue

        result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
        config = result.scalar_one_or_none()

        old_value = config.value if config else None

        if config:
            config.value = str(value)
        else:
            config = SystemConfig(key=key, value=str(value))
            db.add(config)

        # Audit log
        audit = AuditLog(
            user_id=current_user["user_id"],
            action="update_config",
            entity="system_config",
            entity_id=key,
            old_data={"value": old_value},
            new_data={"value": str(value)},
        )
        db.add(audit)

        updated.append({"key": key, "value": str(value)})

    await db.flush()
    log.info(f"Config updated by admin {current_user['user_id']}: {updated}")
    return {"updated": updated}


# ── ANALYTICS ────────────────────────────────────────────────────

@router.get("/analytics")
async def get_analytics(
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Trends, top zones, payout distribution."""
    service = AdminAnalyticsService(db)
    return await service.get_analytics_overview()


# ── ADMIN NOTIFICATIONS ─────────────────────────────────────────

@router.get("/notifications")
async def get_admin_notifications(
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get admin-specific notifications."""
    result = await db.execute(
        select(AdminNotification)
        .where(AdminNotification.admin_id == current_user["user_id"])
        .order_by(AdminNotification.created_at.desc())
    )
    notifs = result.scalars().all()

    unread = sum(1 for n in notifs if not n.is_read)

    return {
        "notifications": [
            {
                "id": n.id,
                "admin_type": n.admin_type,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifs
        ],
        "total": len(notifs),
        "unread_count": unread,
    }


@router.post("/notifications/read/{notification_id}")
async def mark_admin_notification_read(
    notification_id: str,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Mark an admin notification as read."""
    result = await db.execute(
        select(AdminNotification).where(
            AdminNotification.id == notification_id,
            AdminNotification.admin_id == current_user["user_id"],
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notif.is_read = True
    await db.flush()
    return {"message": "Notification marked as read"}


# ── AUDIT LOGS ───────────────────────────────────────────────────

@router.get("/audit-logs")
async def get_audit_logs(
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Full audit trail of admin actions."""
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(100)
    )
    logs = result.scalars().all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "entity": l.entity,
            "entity_id": l.entity_id,
            "old_data": l.old_data,
            "new_data": l.new_data,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]
