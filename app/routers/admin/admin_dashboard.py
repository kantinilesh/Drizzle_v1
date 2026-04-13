"""
Admin Dashboard Router — GET /admin/dashboard
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.services.admin.admin_analytics_service import AdminAnalyticsService

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


@router.get("/dashboard")
async def get_dashboard(
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin control tower — aggregated stats."""
    service = AdminAnalyticsService(db)
    return await service.get_dashboard_stats()
