"""
Admin Workers Router — GET /admin/workers, GET /admin/workers/{id}
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.services.admin.admin_worker_service import AdminWorkerService

router = APIRouter(prefix="/admin", tags=["Admin Workers"])


@router.get("/workers")
async def list_workers(
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all workers with stats."""
    service = AdminWorkerService(db)
    return await service.list_all_workers()


@router.get("/workers/{worker_id}")
async def get_worker_detail(
    worker_id: str,
    current_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Full worker detail with policies and claims."""
    service = AdminWorkerService(db)
    result = await service.get_worker_detail(worker_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return result
