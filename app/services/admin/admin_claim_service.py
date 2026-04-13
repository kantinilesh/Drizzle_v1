"""
Admin Claim Service — List, detail, review claims.
"""

import logging
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import (
    Claim, ClaimExplanation, ClaimReview, FraudCheck,
    Worker, AuditLog, AdminNotification, AuthUser,
)

log = logging.getLogger("drizzle.admin.claims")


class AdminClaimService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_all_claims(self, status_filter: Optional[str] = None, zone_filter: Optional[str] = None) -> list:
        """List all claims with worker info and fraud scores."""
        query = select(Claim).order_by(Claim.created_at.desc())

        if status_filter:
            query = query.where(Claim.status == status_filter)
        if zone_filter:
            query = query.where(Claim.zone == zone_filter)

        result = await self.db.execute(query)
        claims = result.scalars().all()

        items = []
        for c in claims:
            # Get worker name
            worker_name = None
            if c.worker_id:
                w = await self.db.execute(select(Worker.full_name).where(Worker.id == c.worker_id))
                worker_name = w.scalar_one_or_none()

            # Get fraud score
            fc = await self.db.execute(select(FraudCheck).where(FraudCheck.claim_id == c.id))
            fraud = fc.scalar_one_or_none()

            items.append({
                "id": c.id,
                "worker_name": worker_name,
                "worker_id": c.worker_id,
                "zone": c.zone,
                "primary_cause": c.primary_cause,
                "status": c.status,
                "fused_score": c.fused_score,
                "payout_amount": c.payout_amount or 0,
                "fraud_score": fraud.fraud_score if fraud else None,
                "fraud_verdict": fraud.verdict if fraud else None,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            })

        return items

    async def get_claim_detail(self, claim_id: str) -> Optional[dict]:
        """Full claim breakdown with explanation, fraud check, reviews."""
        result = await self.db.execute(select(Claim).where(Claim.id == claim_id))
        claim = result.scalar_one_or_none()
        if not claim:
            return None

        # Worker name
        worker_name = None
        if claim.worker_id:
            w = await self.db.execute(select(Worker.full_name).where(Worker.id == claim.worker_id))
            worker_name = w.scalar_one_or_none()

        # Explanation
        exp_result = await self.db.execute(
            select(ClaimExplanation).where(ClaimExplanation.claim_id == claim_id)
        )
        explanation = exp_result.scalar_one_or_none()

        # Fraud check
        fc_result = await self.db.execute(
            select(FraudCheck).where(FraudCheck.claim_id == claim_id)
        )
        fraud = fc_result.scalar_one_or_none()

        # Reviews
        rev_result = await self.db.execute(
            select(ClaimReview).where(ClaimReview.claim_id == claim_id)
            .order_by(ClaimReview.created_at.desc())
        )
        reviews = rev_result.scalars().all()

        return {
            "id": claim.id,
            "worker_id": claim.worker_id,
            "worker_name": worker_name,
            "policy_id": claim.policy_id,
            "zone": claim.zone,
            "status": claim.status,
            "claim_triggered": claim.claim_triggered,
            "primary_cause": claim.primary_cause,
            "confidence": claim.confidence,
            "weather_score": claim.weather_score,
            "traffic_score": claim.traffic_score,
            "social_score": claim.social_score,
            "fused_score": claim.fused_score,
            "payout_amount": claim.payout_amount or 0,
            "reasoning_source": claim.reasoning_source,
            "explanation": explanation.explanation if explanation else None,
            "recommended_action": explanation.recommended_action if explanation else None,
            "fraud_check": {
                "gps_valid": fraud.gps_valid,
                "fraud_score": fraud.fraud_score,
                "verdict": fraud.verdict,
                "anomaly_flag": fraud.anomaly_flag,
            } if fraud else None,
            "reviews": [
                {
                    "id": r.id,
                    "decision": r.decision,
                    "notes": r.notes,
                    "reviewed_by": r.reviewed_by,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in reviews
            ],
            "created_at": claim.created_at.isoformat() if claim.created_at else None,
        }

    async def review_claim(self, claim_id: str, admin_id: str, decision: str, notes: Optional[str] = None) -> dict:
        """Approve or reject a claim. Inserts review, updates status, audit logs."""
        result = await self.db.execute(select(Claim).where(Claim.id == claim_id))
        claim = result.scalar_one_or_none()
        if not claim:
            raise ValueError(f"Claim {claim_id} not found")

        old_status = claim.status

        # 1. Insert claim review
        review = ClaimReview(
            claim_id=claim_id,
            reviewed_by=admin_id,
            decision=decision,
            notes=notes,
        )
        self.db.add(review)

        # 2. Update claim status
        if decision == "approve":
            claim.status = "approved"
        else:
            claim.status = "rejected"
            claim.payout_amount = 0

        # 3. Audit log
        audit = AuditLog(
            user_id=admin_id,
            action=f"{decision}_claim",
            entity="claim",
            entity_id=claim_id,
            old_data={"status": old_status},
            new_data={"status": claim.status, "decision": decision, "notes": notes},
        )
        self.db.add(audit)

        await self.db.flush()

        log.info(f"Claim {claim_id} reviewed: {decision} by admin {admin_id}")

        return {
            "claim_id": claim_id,
            "old_status": old_status,
            "new_status": claim.status,
            "decision": decision,
            "review_id": review.id,
        }
