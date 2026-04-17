
"""
SQLAlchemy ORM Models — EXACTLY matching the SQL schema for Drizzle.
All column names, types, and relationships match the provided DDL.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.config import settings


def utcnow():
    return datetime.utcnow()  # Naive UTC — required for TIMESTAMP WITHOUT TIME ZONE


def gen_uuid():
    return str(uuid.uuid4())


def UUIDCol(primary_key=False, fk=None, **kwargs):
    """Returns the right column type for UUID depending on DB backend."""
    nullable = kwargs.get("nullable", not primary_key)
    if settings.is_sqlite:
        if fk:
            return Column(String, ForeignKey(fk, **{k: v for k, v in kwargs.items() if k in ('ondelete',)}), primary_key=primary_key, nullable=nullable)
        return Column(String, primary_key=primary_key, default=gen_uuid if primary_key else None, nullable=nullable)
    else:
        if fk:
            # Extract FK-specific kwargs
            fk_kwargs = {k: v for k, v in kwargs.items() if k in ('ondelete',)}
            return Column(PG_UUID(as_uuid=False), ForeignKey(fk, **fk_kwargs), primary_key=primary_key, nullable=nullable)
        return Column(PG_UUID(as_uuid=False), primary_key=primary_key, default=gen_uuid if primary_key else None, nullable=nullable)


# ─────────────────────────────────────────────────────────────────
# 1. AUTH USERS
# ─────────────────────────────────────────────────────────────────

class AuthUser(Base):
    __tablename__ = "auth_users"

    id = UUIDCol(primary_key=True)
    email = Column(Text, unique=True, nullable=False, index=True)
    full_name = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    password = Column(Text, nullable=False)          # Plain text per requirement
    role = Column(Text, default="worker")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    sessions = relationship("AuthSession", back_populates="user", cascade="all, delete-orphan")
    worker = relationship("Worker", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


# ─────────────────────────────────────────────────────────────────
# 2. AUTH SESSIONS
# ─────────────────────────────────────────────────────────────────

class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id = UUIDCol(primary_key=True)
    user_id = UUIDCol(fk="auth_users.id", ondelete="CASCADE", nullable=True)
    token = Column(Text, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    user = relationship("AuthUser", back_populates="sessions")


# ─────────────────────────────────────────────────────────────────
# 3. WORKERS
# workers.id = auth_users.id  (shared primary key, 1:1)
# ─────────────────────────────────────────────────────────────────

class Worker(Base):
    __tablename__ = "workers"

    id = UUIDCol(primary_key=True, fk="auth_users.id", ondelete="CASCADE")
    full_name = Column(Text, nullable=False)
    phone = Column(Text, nullable=True)
    zone = Column(Text, nullable=True)
    vehicle_type = Column(Text, nullable=True)
    gps_lat = Column(Float, nullable=True)
    gps_lon = Column(Float, nullable=True)
    daily_income_estimate = Column(Integer, nullable=True)

    total_claims = Column(Integer, default=0)
    total_payout = Column(Float, default=0)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    user = relationship("AuthUser", back_populates="worker")
    policies = relationship("Policy", back_populates="worker", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="worker", cascade="all, delete-orphan")
    risk_signals = relationship("RiskSignal", back_populates="worker", cascade="all, delete-orphan")


# ─────────────────────────────────────────────────────────────────
# 4. POLICIES
# ─────────────────────────────────────────────────────────────────

class Policy(Base):
    __tablename__ = "policies"

    id = UUIDCol(primary_key=True)
    worker_id = UUIDCol(fk="workers.id", ondelete="CASCADE", nullable=True)

    coverage_type = Column(Text, nullable=True)
    coverage_days = Column(Integer, nullable=True)
    sum_insured = Column(Float, nullable=True)

    premium = Column(Float, nullable=True)
    zone_multiplier = Column(Float, nullable=True)

    status = Column(Text, default="active")     # active / expired / cancelled

    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    worker = relationship("Worker", back_populates="policies")
    claims = relationship("Claim", back_populates="policy", cascade="all, delete-orphan")


# ─────────────────────────────────────────────────────────────────
# 5. CLAIMS
# ─────────────────────────────────────────────────────────────────

class Claim(Base):
    __tablename__ = "claims"

    id = UUIDCol(primary_key=True)

    policy_id = UUIDCol(fk="policies.id", ondelete="CASCADE", nullable=True)
    worker_id = UUIDCol(fk="workers.id", ondelete="CASCADE", nullable=True)

    zone = Column(Text, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)

    weather_score = Column(Float, nullable=True)
    traffic_score = Column(Float, nullable=True)
    social_score = Column(Float, nullable=True)

    fused_score = Column(Float, nullable=True)

    claim_triggered = Column(Boolean, nullable=True)
    confidence = Column(Text, nullable=True)
    primary_cause = Column(Text, nullable=True)

    status = Column(Text, default="pending")    # pending / approved / rejected / flagged / paid

    payout_amount = Column(Float, default=0)

    reasoning_source = Column(Text, nullable=True)   # rule_engine / llm

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    worker = relationship("Worker", back_populates="claims")
    policy = relationship("Policy", back_populates="claims")
    explanation_record = relationship("ClaimExplanation", back_populates="claim", uselist=False, cascade="all, delete-orphan")
    fraud_check = relationship("FraudCheck", back_populates="claim", uselist=False, cascade="all, delete-orphan")
    fraud_flags = relationship("FraudFlag", back_populates="claim", cascade="all, delete-orphan")


# ─────────────────────────────────────────────────────────────────
# 6. CLAIM EXPLANATIONS
# ─────────────────────────────────────────────────────────────────

class ClaimExplanation(Base):
    __tablename__ = "claim_explanations"

    id = UUIDCol(primary_key=True)
    claim_id = UUIDCol(fk="claims.id", ondelete="CASCADE", nullable=True)

    explanation = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utcnow)

    # Relationships
    claim = relationship("Claim", back_populates="explanation_record")


# ─────────────────────────────────────────────────────────────────
# 7. FRAUD CHECKS
# ─────────────────────────────────────────────────────────────────

class FraudCheck(Base):
    __tablename__ = "fraud_checks"

    id = UUIDCol(primary_key=True)
    claim_id = UUIDCol(fk="claims.id", ondelete="CASCADE", nullable=True)

    gps_valid = Column(Boolean, nullable=True)
    gps_distance_km = Column(Float, nullable=True)

    multi_server_ok = Column(Boolean, nullable=True)

    score_variance_flag = Column(Boolean, nullable=True)
    anomaly_flag = Column(Boolean, nullable=True)

    fraud_score = Column(Float, nullable=True)
    verdict = Column(Text, nullable=True)       # clean / suspicious / fraudulent

    created_at = Column(DateTime, default=utcnow)

    # Relationships
    claim = relationship("Claim", back_populates="fraud_check")


# ─────────────────────────────────────────────────────────────────
# 8. FRAUD FLAGS
# ─────────────────────────────────────────────────────────────────

class FraudFlag(Base):
    __tablename__ = "fraud_flags"

    id = UUIDCol(primary_key=True)
    claim_id = UUIDCol(fk="claims.id", ondelete="CASCADE", nullable=True)

    flag_type = Column(Text, nullable=True)
    severity = Column(Float, nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utcnow)

    # Relationships
    claim = relationship("Claim", back_populates="fraud_flags")


# ─────────────────────────────────────────────────────────────────
# 9. RISK SIGNALS
# ─────────────────────────────────────────────────────────────────

class RiskSignal(Base):
    __tablename__ = "risk_signals"

    id = UUIDCol(primary_key=True)

    worker_id = UUIDCol(fk="workers.id", ondelete="CASCADE", nullable=True)
    zone = Column(Text, nullable=True)

    weather_score = Column(Float, nullable=True)
    traffic_score = Column(Float, nullable=True)
    social_score = Column(Float, nullable=True)

    weather_level = Column(Text, nullable=True)
    traffic_level = Column(Text, nullable=True)
    social_level = Column(Text, nullable=True)

    source_weather = Column(Text, nullable=True)
    source_traffic = Column(Text, nullable=True)
    source_social = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utcnow)

    # Relationships
    worker = relationship("Worker", back_populates="risk_signals")


# ─────────────────────────────────────────────────────────────────
# 10. NOTIFICATIONS
# ─────────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id = UUIDCol(primary_key=True)

    user_id = UUIDCol(fk="auth_users.id", ondelete="CASCADE", nullable=True)

    # Column named "type" in SQL, mapped as notification_type in Python
    notification_type = Column("type", Text, nullable=True)
    title = Column(Text, nullable=True)
    message = Column(Text, nullable=True)

    is_read = Column(Boolean, default=False)

    created_at = Column(DateTime, default=utcnow)

    # Relationships
    user = relationship("AuthUser", back_populates="notifications")


# ─────────────────────────────────────────────────────────────────
# ADMIN PORTAL MODELS
# ─────────────────────────────────────────────────────────────────

# 11. CLAIM REVIEWS
class ClaimReview(Base):
    __tablename__ = "claim_reviews"

    id = UUIDCol(primary_key=True)
    claim_id = UUIDCol(fk="claims.id", ondelete="CASCADE", nullable=True)
    reviewed_by = UUIDCol(fk="auth_users.id", ondelete="SET NULL", nullable=True)
    decision = Column(Text, nullable=True)        # approve / reject
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    claim = relationship("Claim", backref="reviews")
    reviewer = relationship("AuthUser")


# 12. WORKER ACTIVITY LOGS
class WorkerActivityLog(Base):
    __tablename__ = "worker_activity_logs"

    id = UUIDCol(primary_key=True)
    worker_id = UUIDCol(fk="workers.id", ondelete="CASCADE", nullable=True)
    action = Column(Text, nullable=True)           # login, claim_trigger, policy_purchase
    metadata_json = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    worker = relationship("Worker")


# 13. FRAUD ALERTS
class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = UUIDCol(primary_key=True)
    claim_id = UUIDCol(fk="claims.id", ondelete="CASCADE", nullable=True)
    fraud_score = Column(Float, nullable=True)
    verdict = Column(Text, nullable=True)          # suspicious / fraudulent
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    claim = relationship("Claim", backref="fraud_alerts")


# 14. DAILY METRICS
class DailyMetric(Base):
    __tablename__ = "daily_metrics"

    id = UUIDCol(primary_key=True)
    date = Column(Date, unique=True, nullable=True)
    total_claims = Column(Integer, nullable=True)
    approved_claims = Column(Integer, nullable=True)
    rejected_claims = Column(Integer, nullable=True)
    total_payout = Column(Float, nullable=True)
    fraud_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utcnow)


# 15. ZONE METRICS
class ZoneMetric(Base):
    __tablename__ = "zone_metrics"

    id = UUIDCol(primary_key=True)
    zone = Column(Text, nullable=True)
    date = Column(Date, nullable=True)
    avg_weather_score = Column(Float, nullable=True)
    avg_traffic_score = Column(Float, nullable=True)
    avg_social_score = Column(Float, nullable=True)
    total_claims = Column(Integer, nullable=True)
    total_payout = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utcnow)


# 16. SYSTEM CONFIG
class SystemConfig(Base):
    __tablename__ = "system_config"

    id = UUIDCol(primary_key=True)
    key = Column(Text, unique=True, nullable=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


# 17. AUDIT LOGS
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = UUIDCol(primary_key=True)
    user_id = UUIDCol(fk="auth_users.id", ondelete="SET NULL", nullable=True)
    action = Column(Text, nullable=True)           # e.g. "approve_claim"
    entity = Column(Text, nullable=True)           # claim / policy / worker
    entity_id = UUIDCol(nullable=True)
    old_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    user = relationship("AuthUser")


# 18. ADMIN NOTIFICATIONS
class AdminNotification(Base):
    __tablename__ = "admin_notifications"

    id = UUIDCol(primary_key=True)
    admin_id = UUIDCol(fk="auth_users.id", ondelete="CASCADE", nullable=True)
    admin_type = Column("type", Text, nullable=True)  # fraud_alert / system / claim_review
    title = Column(Text, nullable=True)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    admin = relationship("AuthUser")

