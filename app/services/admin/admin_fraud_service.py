"""
Admin Fraud Service — Fraud alerts, resolution.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    FraudAlert, FraudCheck, AuditLog, AdminNotification, AuthUser,
)

log = logging.getLogger("drizzle.admin.fraud")


class AdminFraudService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_fraud_alerts(self, resolved: Optional[bool] = None) -> list:
        """List all fraud alerts."""
        query = select(FraudAlert).order_by(FraudAlert.created_at.desc())

        if resolved is not None:
            query = query.where(FraudAlert.is_resolved == resolved)

        result = await self.db.execute(query)
        alerts = result.scalars().all()

        return [
            {
                "id": a.id,
                "claim_id": a.claim_id,
                "fraud_score": a.fraud_score,
                "verdict": a.verdict,
                "is_resolved": a.is_resolved,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            }
            for a in alerts
        ]

    async def resolve_fraud_alert(self, alert_id: str, admin_id: str) -> dict:
        """Resolve a fraud alert."""
        result = await self.db.execute(
            select(FraudAlert).where(FraudAlert.id == alert_id)
        )
        alert = result.scalar_one_or_none()
        if not alert:
            raise ValueError(f"Fraud alert {alert_id} not found")

        alert.is_resolved = True
        alert.resolved_at = datetime.now(timezone.utc)

        # Audit log
        audit = AuditLog(
            user_id=admin_id,
            action="resolve_fraud_alert",
            entity="fraud_alert",
            entity_id=alert_id,
            old_data={"is_resolved": False},
            new_data={"is_resolved": True},
        )
        self.db.add(audit)

        await self.db.flush()
        log.info(f"Fraud alert {alert_id} resolved by admin {admin_id}")

        return {
            "alert_id": alert_id,
            "is_resolved": True,
            "resolved_at": alert.resolved_at.isoformat(),
        }

    async def create_fraud_alert(self, claim_id: str, fraud_score: float, verdict: str):
        """Create a fraud alert from a fraud check result. Called by claim_service."""
        alert = FraudAlert(
            claim_id=claim_id,
            fraud_score=fraud_score,
            verdict=verdict,
        )
        self.db.add(alert)

        # Notify all admins
        admin_result = await self.db.execute(
            select(AuthUser.id).where(AuthUser.role == "admin")
        )
        admin_ids = [row[0] for row in admin_result.all()]

        for aid in admin_ids:
            notif = AdminNotification(
                admin_id=aid,
                admin_type="fraud_alert",
                title="New Fraud Alert",
                message=f"Claim {claim_id} flagged: score={fraud_score:.2f} verdict={verdict}",
            )
            self.db.add(notif)

        await self.db.flush()
        log.info(f"Fraud alert created for claim {claim_id}: {verdict}")
