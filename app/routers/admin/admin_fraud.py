"""
Admin Fraud Router — GET /admin/fraud-alerts, POST /admin/fraud-alerts/{id}/resolve,
                     GET /admin/risk
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.services.admin.admin_fraud_service import AdminFraudService
from app.services.admin.admin_analytics_service import AdminAnalyticsService

router = APIRouter(prefix="/admin", tags=["Admin Fraud & Risk"])


@router.get("/fraud-alerts")
async def list_fraud_alerts(
    resolved: bool = Query(None),
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all fraud alerts, optionally filter by resolved status."""
    service = AdminFraudService(db)
    return await service.list_fraud_alerts(resolved=resolved)


@router.post("/fraud-alerts/{alert_id}/resolve")
async def resolve_fraud_alert(
    alert_id: str,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Mark a fraud alert as resolved."""
    service = AdminFraudService(db)
    try:
        return await service.resolve_fraud_alert(alert_id, current_user["user_id"])
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/risk")
async def get_zone_risk(
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated zone-level risk from risk_signals table."""
    service = AdminAnalyticsService(db)
    return await service.get_zone_risk_aggregation()
