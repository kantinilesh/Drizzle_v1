"""
Admin Claims Router — GET /admin/claims, GET /admin/claims/{id}, POST /admin/claims/{id}/review
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.schemas.admin_schemas import ClaimReviewRequest
from app.services.admin.admin_claim_service import AdminClaimService

router = APIRouter(prefix="/admin", tags=["Admin Claims"])


@router.get("/claims")
async def list_claims(
    status_filter: str = Query(None, alias="status"),
    zone: str = Query(None),
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all claims with worker info and fraud scores."""
    service = AdminClaimService(db)
    return await service.list_all_claims(status_filter=status_filter, zone_filter=zone)


@router.get("/claims/{claim_id}")
async def get_claim_detail(
    claim_id: str,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Full claim breakdown — scores, reasoning, fraud check, reviews."""
    service = AdminClaimService(db)
    result = await service.get_claim_detail(claim_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    return result


@router.post("/claims/{claim_id}/review")
async def review_claim(
    claim_id: str,
    req: ClaimReviewRequest,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a claim. Inserts review, updates status, audit logs."""
    service = AdminClaimService(db)
    try:
        result = await service.review_claim(
            claim_id=claim_id,
            admin_id=current_user["user_id"],
            decision=req.decision,
            notes=req.notes,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
