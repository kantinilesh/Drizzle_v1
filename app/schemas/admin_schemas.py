"""
Admin Portal — Pydantic Schemas for request/response validation.
"""

from datetime import datetime, date
from typing import Optional, List, Any

from pydantic import BaseModel, Field


# ═════════════════════════════════════════════════════════════════
# DASHBOARD
# ═════════════════════════════════════════════════════════════════

class DashboardResponse(BaseModel):
    total_workers: int = 0
    active_policies: int = 0
    claims_today: int = 0
    total_payout_today: float = 0.0
    fraud_alerts_count: int = 0
    recent_activity: List[dict] = []


# ═════════════════════════════════════════════════════════════════
# WORKERS
# ═════════════════════════════════════════════════════════════════

class AdminWorkerSummary(BaseModel):
    id: str
    full_name: str
    zone: Optional[str] = None
    vehicle_type: Optional[str] = None
    total_claims: int = 0
    total_payout: float = 0.0
    daily_income_estimate: Optional[int] = None
    created_at: Optional[datetime] = None


class AdminWorkerDetail(BaseModel):
    id: str
    full_name: str
    phone: Optional[str] = None
    zone: Optional[str] = None
    vehicle_type: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None
    daily_income_estimate: Optional[int] = None
    total_claims: int = 0
    total_payout: float = 0.0
    created_at: Optional[datetime] = None
    policies: List[dict] = []
    claims: List[dict] = []


# ═════════════════════════════════════════════════════════════════
# CLAIMS
# ═════════════════════════════════════════════════════════════════

class AdminClaimSummary(BaseModel):
    id: str
    worker_name: Optional[str] = None
    worker_id: Optional[str] = None
    zone: Optional[str] = None
    primary_cause: Optional[str] = None
    status: str
    fused_score: Optional[float] = None
    payout_amount: float = 0.0
    fraud_score: Optional[float] = None
    fraud_verdict: Optional[str] = None
    created_at: Optional[datetime] = None


class AdminClaimDetail(BaseModel):
    id: str
    worker_id: Optional[str] = None
    worker_name: Optional[str] = None
    policy_id: Optional[str] = None
    zone: Optional[str] = None
    status: str
    claim_triggered: Optional[bool] = None
    primary_cause: Optional[str] = None
    confidence: Optional[str] = None
    weather_score: Optional[float] = None
    traffic_score: Optional[float] = None
    social_score: Optional[float] = None
    fused_score: Optional[float] = None
    payout_amount: float = 0.0
    reasoning_source: Optional[str] = None
    explanation: Optional[str] = None
    recommended_action: Optional[str] = None
    fraud_check: Optional[dict] = None
    reviews: List[dict] = []
    created_at: Optional[datetime] = None


class ClaimReviewRequest(BaseModel):
    decision: str = Field(..., pattern="^(approve|reject)$")
    notes: Optional[str] = None


# ═════════════════════════════════════════════════════════════════
# FRAUD
# ═════════════════════════════════════════════════════════════════

class FraudAlertResponse(BaseModel):
    id: str
    claim_id: Optional[str] = None
    fraud_score: Optional[float] = None
    verdict: Optional[str] = None
    is_resolved: bool = False
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None


class ZoneRiskResponse(BaseModel):
    zone: str
    avg_weather: float = 0.0
    avg_traffic: float = 0.0
    avg_social: float = 0.0
    signal_count: int = 0


# ═════════════════════════════════════════════════════════════════
# ANALYTICS
# ═════════════════════════════════════════════════════════════════

class DailyMetricResponse(BaseModel):
    date: Optional[date] = None
    total_claims: int = 0
    approved_claims: int = 0
    rejected_claims: int = 0
    total_payout: float = 0.0
    fraud_count: int = 0


class ZoneMetricResponse(BaseModel):
    zone: Optional[str] = None
    date: Optional[date] = None
    avg_weather_score: float = 0.0
    avg_traffic_score: float = 0.0
    avg_social_score: float = 0.0
    total_claims: int = 0
    total_payout: float = 0.0


class AnalyticsResponse(BaseModel):
    daily_trends: List[DailyMetricResponse] = []
    top_zones: List[dict] = []
    payout_distribution: dict = {}
    summary: dict = {}


# ═════════════════════════════════════════════════════════════════
# SYSTEM CONFIG
# ═════════════════════════════════════════════════════════════════

class SystemConfigItem(BaseModel):
    key: str
    value: str
    updated_at: Optional[datetime] = None


class SystemConfigUpdate(BaseModel):
    configs: List[dict] = Field(..., description="List of {key, value} pairs")


# ═════════════════════════════════════════════════════════════════
# AUDIT LOGS
# ═════════════════════════════════════════════════════════════════

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: Optional[str] = None
    entity: Optional[str] = None
    entity_id: Optional[str] = None
    old_data: Optional[Any] = None
    new_data: Optional[Any] = None
    created_at: Optional[datetime] = None


# ═════════════════════════════════════════════════════════════════
# ADMIN NOTIFICATIONS
# ═════════════════════════════════════════════════════════════════

class AdminNotificationResponse(BaseModel):
    id: str
    admin_type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None


# ═════════════════════════════════════════════════════════════════
# POLICIES (ADMIN)
# ═════════════════════════════════════════════════════════════════

class AdminPolicyCreateRequest(BaseModel):
    worker_id: str
    coverage_type: str = "standard"
    coverage_days: int = Field(30, gt=0)
    sum_insured: float = Field(..., gt=0)
    premium: float = Field(..., gt=0)
    zone_multiplier: float = Field(1.0, ge=0)
