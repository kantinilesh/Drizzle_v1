"""
Admin Policies Router — GET /admin/policies, POST /admin/policies/create
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.models.models import Policy, Worker, AuditLog
from app.schemas.admin_schemas import AdminPolicyCreateRequest
from app.services.policy_service import PolicyService

router = APIRouter(prefix="/admin", tags=["Admin Policies"])


@router.get("/policies")
async def list_policies(
    status_filter: str = Query(None, alias="status"),
    zone: str = Query(None),
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all policies, optionally filtered by status and zone."""
    query = select(Policy).order_by(Policy.created_at.desc())

    if status_filter:
        query = query.where(Policy.status == status_filter)

    if zone:
        # Join with worker to filter by zone
        query = query.join(Worker, Policy.worker_id == Worker.id).where(Worker.zone == zone)

    result = await db.execute(query)
    policies = result.scalars().all()

    items = []
    for p in policies:
        # Get worker name
        w_result = await db.execute(select(Worker.full_name, Worker.zone).where(Worker.id == p.worker_id))
        w = w_result.one_or_none()

        items.append({
            "id": p.id,
            "worker_id": p.worker_id,
            "worker_name": w[0] if w else None,
            "worker_zone": w[1] if w else None,
            "coverage_type": p.coverage_type,
            "coverage_days": p.coverage_days,
            "sum_insured": p.sum_insured,
            "premium": p.premium,
            "zone_multiplier": p.zone_multiplier,
            "status": p.status,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "end_date": p.end_date.isoformat() if p.end_date else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    return items


@router.post("/policies/create", status_code=status.HTTP_201_CREATED)
async def admin_create_policy(
    req: AdminPolicyCreateRequest,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin creates a policy manually for a worker."""
    # Verify worker exists
    result = await db.execute(select(Worker).where(Worker.id == req.worker_id))
    worker = result.scalar_one_or_none()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    service = PolicyService(db)
    try:
        policy = await service.create_policy(
            worker_id=req.worker_id,
            coverage_type=req.coverage_type,
            coverage_days=req.coverage_days,
            sum_insured=req.sum_insured,
            premium=req.premium,
            zone_multiplier=req.zone_multiplier,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    # Audit log
    audit = AuditLog(
        user_id=current_user["user_id"],
        action="create_policy",
        entity="policy",
        entity_id=policy.id,
        new_data={
            "worker_id": req.worker_id,
            "coverage_type": req.coverage_type,
            "sum_insured": req.sum_insured,
            "premium": req.premium,
        },
    )
    db.add(audit)

    return {
        "id": policy.id,
        "worker_id": policy.worker_id,
        "coverage_type": policy.coverage_type,
        "status": policy.status,
        "sum_insured": policy.sum_insured,
        "premium": policy.premium,
        "start_date": policy.start_date.isoformat() if policy.start_date else None,
        "end_date": policy.end_date.isoformat() if policy.end_date else None,
    }
