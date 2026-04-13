"""
Admin Worker Service — List workers, worker detail.
"""

import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Worker, Policy, Claim

log = logging.getLogger("drizzle.admin.workers")


class AdminWorkerService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_all_workers(self) -> list:
        """List all workers with stats."""
        result = await self.db.execute(
            select(Worker).order_by(Worker.created_at.desc())
        )
        workers = result.scalars().all()

        return [
            {
                "id": w.id,
                "full_name": w.full_name,
                "zone": w.zone,
                "vehicle_type": w.vehicle_type,
                "total_claims": w.total_claims or 0,
                "total_payout": w.total_payout or 0,
                "daily_income_estimate": w.daily_income_estimate,
                "created_at": w.created_at.isoformat() if w.created_at else None,
            }
            for w in workers
        ]

    async def get_worker_detail(self, worker_id: str) -> Optional[dict]:
        """Full worker detail with policies and claims."""
        result = await self.db.execute(
            select(Worker).where(Worker.id == worker_id)
        )
        worker = result.scalar_one_or_none()
        if not worker:
            return None

        # Get policies
        pol_result = await self.db.execute(
            select(Policy).where(Policy.worker_id == worker_id)
            .order_by(Policy.created_at.desc())
        )
        policies = pol_result.scalars().all()

        # Get claims
        claim_result = await self.db.execute(
            select(Claim).where(Claim.worker_id == worker_id)
            .order_by(Claim.created_at.desc())
        )
        claims = claim_result.scalars().all()

        return {
            "id": worker.id,
            "full_name": worker.full_name,
            "phone": worker.phone,
            "zone": worker.zone,
            "vehicle_type": worker.vehicle_type,
            "gps_lat": worker.gps_lat,
            "gps_lon": worker.gps_lon,
            "daily_income_estimate": worker.daily_income_estimate,
            "total_claims": worker.total_claims or 0,
            "total_payout": worker.total_payout or 0,
            "created_at": worker.created_at.isoformat() if worker.created_at else None,
            "policies": [
                {
                    "id": p.id,
                    "coverage_type": p.coverage_type,
                    "sum_insured": p.sum_insured,
                    "premium": p.premium,
                    "status": p.status,
                    "start_date": p.start_date.isoformat() if p.start_date else None,
                    "end_date": p.end_date.isoformat() if p.end_date else None,
                }
                for p in policies
            ],
            "claims": [
                {
                    "id": c.id,
                    "status": c.status,
                    "fused_score": c.fused_score,
                    "payout_amount": c.payout_amount or 0,
                    "primary_cause": c.primary_cause,
                    "zone": c.zone,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in claims
            ],
        }
