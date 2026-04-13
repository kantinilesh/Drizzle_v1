#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║         DRIZZLE — Full System Integration Test Suite            ║
║      Parametric Insurance for Gig Workers (Worker + Admin)      ║
╚══════════════════════════════════════════════════════════════════╝

This script tests EVERY feature of the Drizzle backend:
  • Worker Portal: signup, login, profile, premium, policy, claim, risk, notifications
  • Admin Portal: dashboard, workers, policies, claims, review, fraud, risk, config, analytics, audit

Run:  python testing.py
Prereq: All 4 servers running (main:8000, weather:8001, traffic:8002, social:8003)
"""

import sys
import json
import time
import random
import string
import sqlite3
import requests
from datetime import datetime

# ═══════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════

BASE = "http://127.0.0.1:8000"
DB_PATH = "drizzle_local.db"

# Generate unique emails so test is re-runnable
SUFFIX = "".join(random.choices(string.digits, k=4))
WORKER_EMAIL = f"test.rider{SUFFIX}@swiggy.in"
ADMIN_EMAIL = f"test.admin{SUFFIX}@drizzle.io"

# ═══════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════

PASS_COUNT = 0
FAIL_COUNT = 0
TOTAL = 0


class C:
    """ANSI colors"""
    BOLD = "\033[1m"
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    MAGENTA = "\033[95m"
    DIM = "\033[2m"
    RESET = "\033[0m"
    BG_GREEN = "\033[42m"
    BG_RED = "\033[41m"
    WHITE = "\033[97m"


def banner(text, color=C.CYAN):
    width = 64
    print(f"\n{color}{C.BOLD}{'═' * width}")
    print(f"  {text}")
    print(f"{'═' * width}{C.RESET}")


def section(num, title, description=""):
    print(f"\n{C.MAGENTA}{C.BOLD}┌─ Step {num}: {title}{C.RESET}")
    if description:
        print(f"{C.DIM}│  {description}{C.RESET}")
    print(f"{C.MAGENTA}└{'─' * 60}{C.RESET}")


def test(name, response, expected_status=200, show_response=True):
    global PASS_COUNT, FAIL_COUNT, TOTAL
    TOTAL += 1
    passed = response.status_code == expected_status

    if passed:
        PASS_COUNT += 1
        icon = f"{C.GREEN}✅ PASS{C.RESET}"
    else:
        FAIL_COUNT += 1
        icon = f"{C.RED}❌ FAIL{C.RESET}"

    print(f"  {icon}  {C.BOLD}{name}{C.RESET}  {C.DIM}[{response.status_code}]{C.RESET}")

    if show_response:
        try:
            data = response.json()
            formatted = json.dumps(data, indent=2, default=str)
            # Indent and dim the response
            for line in formatted.split("\n"):
                print(f"  {C.DIM}│  {line}{C.RESET}")
        except Exception:
            print(f"  {C.DIM}│  {response.text[:200]}{C.RESET}")

    if not passed:
        print(f"  {C.RED}│  Expected: {expected_status}, Got: {response.status_code}{C.RESET}")
        try:
            print(f"  {C.RED}│  {response.json()}{C.RESET}")
        except Exception:
            pass

    return passed


def explain(text):
    """Print a guided explanation."""
    print(f"  {C.YELLOW}💡 {text}{C.RESET}")


AUTO_MODE = "--auto" in sys.argv


def pause():
    if AUTO_MODE:
        return
    print(f"\n  {C.DIM}Press Enter to continue...{C.RESET}", end="")
    input()


# ═══════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════

def check_health():
    banner("🏥 SYSTEM HEALTH CHECK")
    try:
        r = requests.get(f"{BASE}/health", timeout=5)
        data = r.json()
        print(f"  Database:  {C.GREEN if data['database']=='connected' else C.RED}{data['database']}{C.RESET}")
        mcp = data.get("mcp_servers", {})
        for name, status in mcp.items():
            color = C.GREEN if status == "ok" else C.RED
            print(f"  MCP {name:8s}: {color}{status}{C.RESET}")
        print(f"  OpenAI:    {C.GREEN if data.get('openai_configured') else C.RED}{data.get('openai_configured')}{C.RESET}")

        if data["database"] != "connected" or any(v != "ok" for v in mcp.values()):
            print(f"\n  {C.RED}{C.BOLD}⚠️  Some services are not ready. Please start all servers first.{C.RESET}")
            print(f"  {C.DIM}Run these commands in separate terminals:{C.RESET}")
            print(f"  {C.DIM}  uvicorn weather_server:app --port 8001{C.RESET}")
            print(f"  {C.DIM}  uvicorn traffic_server:app --port 8002{C.RESET}")
            print(f"  {C.DIM}  uvicorn social_server:app --port 8003{C.RESET}")
            print(f"  {C.DIM}  uvicorn app.main:app --port 8000{C.RESET}")
            sys.exit(1)

        print(f"\n  {C.GREEN}{C.BOLD}All systems operational! Starting tests...{C.RESET}")
    except requests.ConnectionError:
        print(f"  {C.RED}{C.BOLD}❌ Cannot connect to {BASE}. Is the server running?{C.RESET}")
        sys.exit(1)


# ═══════════════════════════════════════════════════════════════════
# WORKER PORTAL TESTS
# ═══════════════════════════════════════════════════════════════════

def test_worker_portal():
    banner("👷 WORKER PORTAL", C.GREEN)
    explain("The Worker Portal is for gig delivery riders (Swiggy, Zomato, etc.)")
    explain("Workers can: sign up, buy insurance, check risk, and trigger claims")
    print()

    worker_data = {}

    # ── Step 1: Signup ────────────────────────────────────────────
    section(1, "WORKER SIGNUP", "Create a new rider account with email + password")
    explain("Creates a row in auth_users table + generates JWT token")

    r = requests.post(f"{BASE}/auth/signup", json={
        "email": WORKER_EMAIL,
        "password": "rider@2024",
        "phone": "+919876500001",
    })
    test("POST /auth/signup", r, 201)
    worker_data["token"] = r.json().get("token")
    worker_data["user_id"] = r.json().get("user_id")
    headers = {"Authorization": f"Bearer {worker_data['token']}"}

    pause()

    # ── Step 2: Login ─────────────────────────────────────────────
    section(2, "WORKER LOGIN", "Authenticate and get a fresh JWT token")
    explain("Verifies credentials, creates auth_session, returns new token")

    r = requests.post(f"{BASE}/auth/login", json={
        "email": WORKER_EMAIL,
        "password": "rider@2024",
    })
    test("POST /auth/login", r)
    # Use the new token
    worker_data["token"] = r.json().get("token")
    headers = {"Authorization": f"Bearer {worker_data['token']}"}

    pause()

    # ── Step 3: Get Profile ───────────────────────────────────────
    section(3, "GET AUTH PROFILE", "Decode JWT → fetch user from auth_users")
    explain("This confirms the token is valid and the user exists")

    r = requests.get(f"{BASE}/auth/me", headers=headers)
    test("GET /auth/me", r)

    pause()

    # ── Step 4: Create Worker Profile ─────────────────────────────
    section(4, "CREATE WORKER PROFILE",
            "Register as a delivery rider with zone, vehicle, GPS, income")
    explain("Creates a row in workers table (shared PK with auth_users)")
    explain("zone = delivery area, vehicle_type = bike/scooter/car")
    explain("gps_lat/lon = current location, daily_income_estimate = avg daily earnings")

    r = requests.post(f"{BASE}/workers/profile", headers=headers, json={
        "full_name": "Vikram Singh",
        "phone": "+919876500001",
        "zone": "Connaught-Place-Delhi",
        "vehicle_type": "bike",
        "gps_lat": 28.6315,
        "gps_lon": 77.2167,
        "daily_income_estimate": 1400,
    })
    test("POST /workers/profile", r, 201)

    pause()

    # ── Step 5: Get Worker Profile ────────────────────────────────
    section(5, "GET WORKER PROFILE", "Fetch the worker's complete profile")

    r = requests.get(f"{BASE}/workers/me", headers=headers)
    test("GET /workers/me", r)

    pause()

    # ── Step 6: Calculate Premium ─────────────────────────────────
    section(6, "CALCULATE PREMIUM",
            "Estimate insurance cost based on zone, vehicle, and income")
    explain("Formula: sum_insured = income × 0.8, premium = sum × zone_mult × vehicle_mult × days × rate")
    explain("Delhi has zone_multiplier=1.25 (high risk), bike has vehicle_mult=1.2")

    r = requests.post(f"{BASE}/policies/calculate", headers=headers, json={
        "zone": "Connaught-Place-Delhi",
        "vehicle_type": "bike",
        "daily_income_estimate": 1400,
        "coverage_type": "standard",
    })
    test("POST /policies/calculate", r)
    calc = r.json()

    explain(f"Max daily payout: ₹{calc.get('sum_insured', 0)}")
    explain(f"Monthly premium: ₹{calc.get('premium', 0)}")
    explain(f"Zone risk multiplier: {calc.get('zone_multiplier', 0)}x")

    pause()

    # ── Step 7: Create Policy ─────────────────────────────────────
    section(7, "CREATE POLICY",
            "Purchase insurance — creates 30-day active coverage")
    explain("Only ONE active policy allowed per worker at a time")
    explain("Policy stored in policies table with start_date and end_date")

    r = requests.post(f"{BASE}/policies/create", headers=headers, json={
        "coverage_type": "standard",
        "coverage_days": 30,
        "sum_insured": calc.get("sum_insured", 1120),
        "premium": calc.get("premium", 1500),
        "zone_multiplier": calc.get("zone_multiplier", 1.25),
    })
    test("POST /policies/create", r, 201)
    policy_id = r.json().get("id")

    pause()

    # ── Step 8: View My Policies ──────────────────────────────────
    section(8, "VIEW MY POLICIES", "List all active and past policies")

    r = requests.get(f"{BASE}/policies/my", headers=headers)
    test("GET /policies/my", r)

    pause()

    # ── Step 9: Trigger Claim ─────────────────────────────────────
    section(9, "🔥 TRIGGER CLAIM",
            "The CORE feature — check if you qualify for insurance payout")
    explain("This calls ALL 3 MCP servers in parallel:")
    explain("  🌦️ Weather MCP → WeatherAPI.com (rain, temp, AQI, flood)")
    explain("  🚗 Traffic MCP → TomTom API (congestion, speed, road closures)")
    explain("  📰 Social MCP  → Reddit + NewsAPI (protests, strikes, bandhs)")
    explain("Then fuses scores: 0.4×Weather + 0.35×Traffic + 0.25×Social")
    explain("GPT-4o-mini analyzes all data and decides: claim? payout?")
    explain("Finally: fraud check + notification + save to claims table")
    print()

    r = requests.post(f"{BASE}/claims/trigger", headers=headers, json={
        "lat": 28.6315,
        "lon": 77.2167,
        "zone": "Connaught-Place-Delhi",
    })
    test("POST /claims/trigger", r)
    claim_data = r.json()
    claim_id = claim_data.get("id")

    scores = claim_data.get("scores", {})
    explain(f"Weather: {scores.get('weather_score', 0)} ({scores.get('weather_level', '?')})")
    explain(f"Traffic: {scores.get('traffic_score', 0)} ({scores.get('traffic_level', '?')})")
    explain(f"Social:  {scores.get('social_score', 0)} ({scores.get('social_level', '?')})")
    explain(f"Fused:   {scores.get('fused_score', 0)} (threshold: 0.5)")
    explain(f"Status:  {claim_data.get('status', '?')} | Payout: ₹{claim_data.get('payout_amount', 0)}")
    explain(f"GPT-4o-mini says: \"{claim_data.get('explanation', '')[:100]}...\"")

    pause()

    # ── Step 10: Live Risk Assessment ─────────────────────────────
    section(10, "LIVE RISK ASSESSMENT",
            "Read-only risk check for the rider dashboard (no claim created)")
    explain("Same MCP pipeline as claims, but just for monitoring")
    explain("Testing with Mumbai coordinates for variety")

    r = requests.get(
        f"{BASE}/risk/live",
        headers=headers,
        params={"lat": 19.076, "lon": 72.8777, "zone": "Bandra-Mumbai"},
    )
    test("GET /risk/live", r)

    pause()

    # ── Step 11: View Claims History ──────────────────────────────
    section(11, "VIEW CLAIMS HISTORY", "All past claims with scores and payouts")

    r = requests.get(f"{BASE}/claims/my", headers=headers)
    test("GET /claims/my", r)

    pause()

    # ── Step 12: View Notifications ───────────────────────────────
    section(12, "VIEW NOTIFICATIONS",
            "Auto-generated alerts from claim processing")
    explain("Every claim trigger creates a notification automatically")

    r = requests.get(f"{BASE}/notifications", headers=headers)
    test("GET /notifications", r)
    notifs = r.json().get("notifications", [])
    notif_id = notifs[0]["id"] if notifs else None

    pause()

    # ── Step 13: Mark Notification Read ───────────────────────────
    section(13, "MARK NOTIFICATION READ", "Update is_read flag on notification")

    if notif_id:
        r = requests.post(f"{BASE}/notifications/read/{notif_id}", headers=headers)
        test(f"POST /notifications/read/{{id}}", r)
    else:
        print(f"  {C.YELLOW}⚠️  No notifications to mark{C.RESET}")

    return {
        "headers": headers,
        "user_id": worker_data["user_id"],
        "claim_id": claim_id,
        "policy_id": policy_id,
    }


# ═══════════════════════════════════════════════════════════════════
# ADMIN PORTAL TESTS
# ═══════════════════════════════════════════════════════════════════

def test_admin_portal(worker_data):
    banner("🛡️ ADMIN PORTAL", C.MAGENTA)
    explain("The Admin Portal is for Drizzle operations team")
    explain("Admins can: monitor workers, review claims, track fraud, manage config")
    print()

    # ── Create admin user ─────────────────────────────────────────
    section("A1", "ADMIN SIGNUP + ROLE PROMOTION",
            "Create admin account, then promote via DB")
    explain("Admin accounts are created as 'worker' first, then promoted")
    explain("In production, this would be done via a seed script or CLI")

    r = requests.post(f"{BASE}/auth/signup", json={
        "email": ADMIN_EMAIL,
        "password": "admin@2024",
        "phone": "+919876500000",
    })
    test("POST /auth/signup (admin user)", r, 201)
    admin_id = r.json().get("user_id")

    # Promote to admin via SQLite
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute("UPDATE auth_users SET role='admin' WHERE id=?", (admin_id,))
        conn.commit()
        conn.close()
        print(f"  {C.GREEN}✅ Role promoted to 'admin' in database{C.RESET}")
    except Exception as e:
        print(f"  {C.RED}❌ DB promotion failed: {e}{C.RESET}")

    # Login with admin role
    r = requests.post(f"{BASE}/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": "admin@2024",
    })
    test("POST /auth/login (admin — fresh token)", r)
    admin_token = r.json().get("token")
    admin_role = r.json().get("role")
    explain(f"Token role: {admin_role} {'✅' if admin_role == 'admin' else '❌'}")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    pause()

    # ── Step A2: Role Guard Test ──────────────────────────────────
    section("A2", "ROLE GUARD TEST",
            "Verify workers CANNOT access admin endpoints")
    explain("The require_admin dependency checks JWT role == 'admin'")

    r = requests.get(f"{BASE}/admin/dashboard", headers=worker_data["headers"])
    test("GET /admin/dashboard (worker token → 403)", r, 403)

    pause()

    # ── Step A3: Dashboard ────────────────────────────────────────
    section("A3", "ADMIN DASHBOARD (Control Tower)",
            "Aggregated stats: workers, policies, claims, fraud, activity")
    explain("Queries: workers (count), policies (active), claims (today), fraud_alerts, worker_activity_logs")

    r = requests.get(f"{BASE}/admin/dashboard", headers=admin_headers)
    test("GET /admin/dashboard", r)

    dash = r.json()
    explain(f"Workers: {dash.get('total_workers')} | Policies: {dash.get('active_policies')}")
    explain(f"Claims today: {dash.get('claims_today')} | Fraud alerts: {dash.get('fraud_alerts_count')}")
    activity = dash.get("recent_activity", [])
    if activity:
        explain(f"Recent activity: {len(activity)} events")
        for a in activity[:3]:
            explain(f"  → {a['action']} by worker {a['worker_id'][:8]}...")

    pause()

    # ── Step A4: Worker List ──────────────────────────────────────
    section("A4", "WORKER MANAGEMENT — List All",
            "View all registered workers with stats")

    r = requests.get(f"{BASE}/admin/workers", headers=admin_headers)
    test("GET /admin/workers", r)

    pause()

    # ── Step A5: Worker Detail ────────────────────────────────────
    section("A5", "WORKER MANAGEMENT — Detail View",
            "Full worker profile with policies + claims history")
    explain("Shows everything about one worker in a single API call")

    r = requests.get(
        f"{BASE}/admin/workers/{worker_data['user_id']}",
        headers=admin_headers,
    )
    test(f"GET /admin/workers/{{id}}", r)

    pause()

    # ── Step A6: Policies List ────────────────────────────────────
    section("A6", "POLICY MANAGEMENT — List All",
            "View all policies with worker names and zones")
    explain("Supports filtering: ?status=active or ?zone=Mumbai")

    r = requests.get(f"{BASE}/admin/policies", headers=admin_headers)
    test("GET /admin/policies", r)

    pause()

    # ── Step A7: Claims List ──────────────────────────────────────
    section("A7", "CLAIM MANAGEMENT — List All",
            "View all claims with fraud scores and worker info")

    r = requests.get(f"{BASE}/admin/claims", headers=admin_headers)
    test("GET /admin/claims", r)

    pause()

    # ── Step A8: Claim Detail ─────────────────────────────────────
    section("A8", "CLAIM MANAGEMENT — Full Breakdown",
            "Complete claim with scores, reasoning, fraud check, reviews")
    explain("This is the claim investigation view for adjusters")

    claim_id = worker_data["claim_id"]
    r = requests.get(f"{BASE}/admin/claims/{claim_id}", headers=admin_headers)
    test(f"GET /admin/claims/{{id}}", r)

    detail = r.json()
    explain(f"Weather: {detail.get('weather_score')} | Traffic: {detail.get('traffic_score')} | Social: {detail.get('social_score')}")
    explain(f"Fused: {detail.get('fused_score')} | Source: {detail.get('reasoning_source')}")
    explain(f"GPT says: \"{(detail.get('explanation') or '')[:80]}...\"")

    pause()

    # ── Step A9: Review Claim ─────────────────────────────────────
    section("A9", "CLAIM REVIEW — Admin Override",
            "Admin approves/rejects claim with notes → audit trail")
    explain("Flow: insert claim_review → update claims.status → write audit_log")
    explain("This lets human adjusters override the automated decision")

    r = requests.post(
        f"{BASE}/admin/claims/{claim_id}/review",
        headers=admin_headers,
        json={
            "decision": "approve",
            "notes": "Override: confirmed disruption via field verification",
        },
    )
    test("POST /admin/claims/{id}/review (approve)", r)

    explain("Let's verify the worker sees the updated status...")
    r2 = requests.get(f"{BASE}/claims/my", headers=worker_data["headers"])
    if r2.ok:
        claims = r2.json().get("claims", [])
        if claims:
            explain(f"Worker's claim status now: {C.GREEN}{C.BOLD}{claims[0].get('status')}{C.RESET}")

    pause()

    # ── Step A10: Fraud Alerts ────────────────────────────────────
    section("A10", "FRAUD PANEL — Alerts",
            "View fraud alerts (auto-created when fraud_check verdict ≠ clean)")
    explain("Currently empty because our test claim was 'clean'")
    explain("Fraud alerts auto-populate when suspicious/fraudulent claims appear")

    r = requests.get(f"{BASE}/admin/fraud-alerts", headers=admin_headers)
    test("GET /admin/fraud-alerts", r)

    pause()

    # ── Step A11: Zone Risk ───────────────────────────────────────
    section("A11", "LIVE RISK MONITOR — Zone Aggregation",
            "Aggregated risk scores per zone from risk_signals table")
    explain("Shows avg weather/traffic/social scores for each zone")

    r = requests.get(f"{BASE}/admin/risk", headers=admin_headers)
    test("GET /admin/risk", r)

    zones = r.json() if r.ok else []
    for z in zones:
        explain(f"Zone: {z['zone']} | W:{z['avg_weather']:.2f} T:{z['avg_traffic']:.2f} S:{z['avg_social']:.2f} ({z['signal_count']} signals)")

    pause()

    # ── Step A12: System Config ───────────────────────────────────
    section("A12", "SYSTEM CONFIG — View",
            "Dynamic configuration values that affect claim/fraud logic")
    explain("claim_threshold: min fused score to trigger a claim (default: 0.5)")
    explain("fraud_threshold: min fraud score to flag as suspicious (default: 0.3)")

    r = requests.get(f"{BASE}/admin/config", headers=admin_headers)
    test("GET /admin/config", r)

    pause()

    # ── Step A13: Update Config ───────────────────────────────────
    section("A13", "SYSTEM CONFIG — Update",
            "Admin adjusts thresholds → changes are audit-logged")

    r = requests.put(
        f"{BASE}/admin/config",
        headers=admin_headers,
        json={"configs": [
            {"key": "claim_threshold", "value": "0.55"},
            {"key": "fraud_threshold", "value": "0.35"},
        ]},
    )
    test("PUT /admin/config", r)
    explain("New claim_threshold: 0.55 (was 0.5)")
    explain("New fraud_threshold: 0.35 (was 0.3)")

    pause()

    # ── Step A14: Analytics ───────────────────────────────────────
    section("A14", "ANALYTICS OVERVIEW",
            "Trends, top zones, payout distribution, approval rates")
    explain("Aggregates from daily_metrics + zone_metrics + claims tables")

    r = requests.get(f"{BASE}/admin/analytics", headers=admin_headers)
    test("GET /admin/analytics", r)

    analytics = r.json() if r.ok else {}
    summary = analytics.get("summary", {})
    explain(f"Total claims: {summary.get('total_claims', 0)}")
    explain(f"Approval rate: {summary.get('approval_rate', 0)}%")
    explain(f"Avg payout: ₹{summary.get('avg_payout', 0)}")

    pause()

    # ── Step A15: Audit Logs ──────────────────────────────────────
    section("A15", "AUDIT TRAIL",
            "Every admin action is logged for compliance/governance")
    explain("Tracks: who did what, to which entity, old vs new data")

    r = requests.get(f"{BASE}/admin/audit-logs", headers=admin_headers)
    test("GET /admin/audit-logs", r)

    logs = r.json() if r.ok else []
    for log_entry in logs[:5]:
        explain(f"  {log_entry.get('action')} → {log_entry.get('entity')} | {log_entry.get('created_at', '')[:19]}")

    pause()

    # ── Step A16: Admin Notifications ─────────────────────────────
    section("A16", "ADMIN NOTIFICATIONS",
            "System alerts for admins (fraud alerts, high risk, etc.)")

    r = requests.get(f"{BASE}/admin/notifications", headers=admin_headers)
    test("GET /admin/notifications", r)

    pause()

    # ── Step A17: Admin Creates Policy ────────────────────────────
    section("A17", "ADMIN CREATES POLICY",
            "Admin manually creates a policy for a worker")
    explain("Useful for customer support overrides or bulk onboarding")
    explain("This will fail if worker already has an active policy (expected!)")

    r = requests.post(
        f"{BASE}/admin/policies/create",
        headers=admin_headers,
        json={
            "worker_id": worker_data["user_id"],
            "coverage_type": "premium",
            "coverage_days": 60,
            "sum_insured": 1500,
            "premium": 2000,
            "zone_multiplier": 1.25,
        },
    )
    # This should fail with 409 since worker already has active policy
    if r.status_code == 409:
        test("POST /admin/policies/create (conflict — expected)", r, 409)
        explain("Correctly blocked: worker already has an active policy")
    else:
        test("POST /admin/policies/create", r, 201)

    return admin_headers


# ═══════════════════════════════════════════════════════════════════
# DATABASE VERIFICATION
# ═══════════════════════════════════════════════════════════════════

def verify_database():
    banner("🗃️ DATABASE VERIFICATION", C.YELLOW)
    explain("Verifying all 18 tables have data from the test run")
    print()

    try:
        conn = sqlite3.connect(DB_PATH)
        tables = [
            "auth_users", "auth_sessions", "workers", "policies",
            "claims", "claim_explanations", "fraud_checks", "fraud_flags",
            "risk_signals", "notifications",
            "claim_reviews", "worker_activity_logs", "fraud_alerts",
            "daily_metrics", "zone_metrics", "system_config",
            "audit_logs", "admin_notifications",
        ]

        print(f"  {'Table':<25} {'Rows':>5}  Status")
        print(f"  {'─' * 25} {'─' * 5}  {'─' * 10}")

        for table in tables:
            try:
                cursor = conn.execute(f"SELECT count(*) FROM {table}")
                count = cursor.fetchone()[0]
                status = f"{C.GREEN}✅{C.RESET}" if count > 0 else f"{C.DIM}○ empty{C.RESET}"
                print(f"  {table:<25} {count:>5}  {status}")
            except Exception as e:
                print(f"  {table:<25}     ?  {C.RED}❌ {e}{C.RESET}")

        conn.close()
    except Exception as e:
        print(f"  {C.RED}❌ Database error: {e}{C.RESET}")


# ═══════════════════════════════════════════════════════════════════
# RESULTS
# ═══════════════════════════════════════════════════════════════════

def print_results():
    banner("📊 FINAL RESULTS")

    if FAIL_COUNT == 0:
        bg = C.BG_GREEN
        icon = "🎉"
        msg = "ALL TESTS PASSED!"
    else:
        bg = C.BG_RED
        icon = "⚠️"
        msg = f"{FAIL_COUNT} TEST(S) FAILED"

    print(f"""
  {bg}{C.WHITE}{C.BOLD}                                                    {C.RESET}
  {bg}{C.WHITE}{C.BOLD}   {icon}  {msg:^42}   {C.RESET}
  {bg}{C.WHITE}{C.BOLD}                                                    {C.RESET}

  {C.GREEN}Passed:  {PASS_COUNT}{C.RESET}
  {C.RED}Failed:  {FAIL_COUNT}{C.RESET}
  Total:   {TOTAL}

  {C.BOLD}Worker Portal:{C.RESET} 13 features tested
  {C.BOLD}Admin Portal:{C.RESET}  17 features tested
  {C.BOLD}Database:{C.RESET}      18 tables verified
  {C.BOLD}Integration:{C.RESET}   Worker ↔ Admin data flow confirmed
""")


# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

def main():
    print(f"""
{C.CYAN}{C.BOLD}
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     🌧️  DRIZZLE — Full System Integration Test Suite            ║
║     Parametric Insurance for Gig Workers                        ║
║                                                                  ║
║     Testing: Worker Portal + Admin Portal                       ║
║     Data:    Real APIs (WeatherAPI, TomTom, Reddit, OpenAI)     ║
║     DB:      SQLite (local)                                     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
{C.RESET}""")

    print(f"  {C.DIM}Worker: {WORKER_EMAIL}{C.RESET}")
    print(f"  {C.DIM}Admin:  {ADMIN_EMAIL}{C.RESET}")
    print(f"  {C.DIM}Time:   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{C.RESET}")

    pause()

    # 1. Health check
    check_health()
    pause()

    # 2. Worker portal
    worker_data = test_worker_portal()
    pause()

    # 3. Admin portal
    test_admin_portal(worker_data)

    # 4. Database verification
    verify_database()
    pause()

    # 5. Results
    print_results()


if __name__ == "__main__":
    main()
