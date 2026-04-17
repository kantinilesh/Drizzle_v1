// ========================================
// DRIZZLE ADMIN API SERVICE
// All endpoints require admin JWT token
// Base: /api/v1/admin/...
// ========================================

import { API_BASE_URL, fetchAPI, USE_MOCK } from './api';

const delay = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms));

// ── Mock Data ─────────────────────────────────────────────────────

const MOCK_DASHBOARD = {
  total_workers: 1240,
  active_policies: 860,
  claims_today: 112,
  total_payout_today: 84200,
  fraud_alerts_count: 6,
  recent_activity: [
    { type: 'claim_triggered', worker: 'Rahul K.', amount: 420, time: '2 min ago' },
    { type: 'claim_pending', worker: 'Priya M.', amount: 0, note: 'Suspicious', time: '5 min ago' },
    { type: 'claim_approved', worker: 'Amit S.', amount: 320, time: '12 min ago' },
    { type: 'policy_created', worker: 'Kavya R.', amount: 1207, time: '18 min ago' },
    { type: 'fraud_flagged', worker: 'Unknown', amount: 0, note: 'GPS mismatch', time: '25 min ago' },
  ],
};

const MOCK_WORKERS = [
  { id: 'w001', full_name: 'Rahul Kumar', zone: 'OMR-Chennai', vehicle_type: 'Bike', total_claims: 3, total_payout: 980, status: 'active', created_at: '2024-01-15' },
  { id: 'w002', full_name: 'Priya Menon', zone: 'Andheri-Mumbai', vehicle_type: 'Scooter', total_claims: 1, total_payout: 420, status: 'active', created_at: '2024-02-03' },
  { id: 'w003', full_name: 'Amit Sharma', zone: 'Koramangala-Bangalore', vehicle_type: 'Bike', total_claims: 0, total_payout: 0, status: 'inactive', created_at: '2024-01-28' },
  { id: 'w004', full_name: 'Kavya Reddy', zone: 'Hitech-Hyderabad', vehicle_type: 'E-Scooter', total_claims: 2, total_payout: 650, status: 'active', created_at: '2024-03-10' },
  { id: 'w005', full_name: 'Sanjay Gupta', zone: 'Connaught-Delhi', vehicle_type: 'Bike', total_claims: 5, total_payout: 1800, status: 'active', created_at: '2024-01-05' },
];

const MOCK_POLICIES = [
  { id: 'pol_001', worker_id: 'w001', worker_name: 'Rahul Kumar', worker_zone: 'OMR-Chennai', coverage_type: 'comprehensive', coverage_days: 30, sum_insured: 35000, premium: 1207, status: 'active', start_date: '2024-04-01', end_date: '2024-05-01' },
  { id: 'pol_002', worker_id: 'w002', worker_name: 'Priya Menon', worker_zone: 'Andheri-Mumbai', coverage_type: 'weather', coverage_days: 14, sum_insured: 20000, premium: 850, status: 'expired', start_date: '2024-03-01', end_date: '2024-03-15' },
  { id: 'pol_003', worker_id: 'w003', worker_name: 'Amit Sharma', worker_zone: 'Koramangala-Bangalore', coverage_type: 'traffic', coverage_days: 30, sum_insured: 25000, premium: 950, status: 'active', start_date: '2024-04-05', end_date: '2024-05-05' },
  { id: 'pol_004', worker_id: 'w004', worker_name: 'Kavya Reddy', worker_zone: 'Hitech-Hyderabad', coverage_type: 'comprehensive', coverage_days: 7, sum_insured: 15000, premium: 490, status: 'active', start_date: '2024-04-10', end_date: '2024-04-17' },
];

const MOCK_CLAIMS = [
  { id: 'clm_001', worker_name: 'Rahul Kumar', worker_id: 'w001', zone: 'OMR-Chennai', primary_cause: 'Weather', status: 'approved', payout_amount: 420, fraud_score: 0.05, fraud_verdict: 'clean', fused_score: 0.72, created_at: '2024-04-15T10:30:00' },
  { id: 'clm_002', worker_name: 'Priya Menon', worker_id: 'w002', zone: 'Andheri-Mumbai', primary_cause: 'Traffic', status: 'pending', payout_amount: 0, fraud_score: 0.25, fraud_verdict: 'suspicious', fused_score: 0.55, created_at: '2024-04-15T11:45:00' },
  { id: 'clm_003', worker_name: 'Amit Sharma', worker_id: 'w003', zone: 'Koramangala-Bangalore', primary_cause: 'Social', status: 'flagged', payout_amount: 0, fraud_score: 0.55, fraud_verdict: 'suspicious', fused_score: 0.48, created_at: '2024-04-15T09:00:00' },
  { id: 'clm_004', worker_name: 'Sanjay Gupta', worker_id: 'w005', zone: 'Connaught-Delhi', primary_cause: 'Weather', status: 'approved', payout_amount: 380, fraud_score: 0.08, fraud_verdict: 'clean', fused_score: 0.68, created_at: '2024-04-14T14:20:00' },
  { id: 'clm_005', worker_name: 'Kavya Reddy', worker_id: 'w004', zone: 'Hitech-Hyderabad', primary_cause: 'Traffic', status: 'rejected', payout_amount: 0, fraud_score: 0.10, fraud_verdict: 'clean', fused_score: 0.35, created_at: '2024-04-13T16:00:00' },
];

const MOCK_FRAUD_ALERTS = [
  { id: 'fra_001', claim_id: 'clm_003', fraud_score: 0.55, verdict: 'suspicious', is_resolved: false, issue: 'GPS mismatch', created_at: '2024-04-15T09:00:00' },
  { id: 'fra_002', claim_id: 'clm_002', fraud_score: 0.30, verdict: 'suspicious', is_resolved: false, issue: 'Server mismatch', created_at: '2024-04-15T11:45:00' },
  { id: 'fra_003', claim_id: 'clm_007', fraud_score: 0.45, verdict: 'suspicious', is_resolved: true, issue: 'Repeated claim pattern', created_at: '2024-04-12T08:00:00' },
];

const MOCK_ANALYTICS = {
  daily_trends: [
    { date: '2024-04-09', total_claims: 8, approved_claims: 6, rejected_claims: 2, total_payout: 2800, fraud_count: 0 },
    { date: '2024-04-10', total_claims: 12, approved_claims: 9, rejected_claims: 3, total_payout: 3600, fraud_count: 1 },
    { date: '2024-04-11', total_claims: 7, approved_claims: 5, rejected_claims: 2, total_payout: 2100, fraud_count: 0 },
    { date: '2024-04-12', total_claims: 15, approved_claims: 11, rejected_claims: 4, total_payout: 4500, fraud_count: 2 },
    { date: '2024-04-13', total_claims: 10, approved_claims: 8, rejected_claims: 2, total_payout: 3200, fraud_count: 1 },
    { date: '2024-04-14', total_claims: 18, approved_claims: 14, rejected_claims: 4, total_payout: 5800, fraud_count: 1 },
    { date: '2024-04-15', total_claims: 22, approved_claims: 17, rejected_claims: 5, total_payout: 7200, fraud_count: 2 },
  ],
  top_zones: [
    { zone: 'OMR-Chennai', total_claims: 45, total_payout: 18200 },
    { zone: 'Andheri-Mumbai', total_claims: 38, total_payout: 15600 },
    { zone: 'Connaught-Delhi', total_claims: 32, total_payout: 12800 },
    { zone: 'Koramangala-Bangalore', total_claims: 25, total_payout: 9800 },
    { zone: 'Hitech-Hyderabad', total_claims: 20, total_payout: 7600 },
  ],
  summary: {
    total_claims: 120,
    approval_rate: 78.3,
    avg_payout: 380,
    fraud_rate: 5.8,
    top_cause: 'Weather',
  },
};

const MOCK_ZONE_RISK = [
  { zone: 'OMR-Chennai', avg_weather: 0.72, avg_traffic: 0.55, avg_social: 0.10, overall: 'HIGH' },
  { zone: 'Andheri-Mumbai', avg_weather: 0.45, avg_traffic: 0.78, avg_social: 0.20, overall: 'MEDIUM' },
  { zone: 'Connaught-Delhi', avg_weather: 0.62, avg_traffic: 0.68, avg_social: 0.35, overall: 'HIGH' },
  { zone: 'Koramangala-Bangalore', avg_weather: 0.30, avg_traffic: 0.50, avg_social: 0.15, overall: 'MEDIUM' },
  { zone: 'Hitech-Hyderabad', avg_weather: 0.25, avg_traffic: 0.40, avg_social: 0.10, overall: 'LOW' },
];

const MOCK_CONFIG = [
  { key: 'claim_threshold', value: '0.5', updated_at: '2024-04-10T10:00:00' },
  { key: 'fraud_threshold', value: '0.3', updated_at: '2024-04-10T10:00:00' },
  { key: 'fraud_sensitivity', value: 'medium', updated_at: '2024-04-10T10:00:00' },
  { key: 'weather_mcp_url', value: 'http://127.0.0.1:8001/score', updated_at: '2024-04-10T10:00:00' },
  { key: 'traffic_mcp_url', value: 'http://127.0.0.1:8002/score', updated_at: '2024-04-10T10:00:00' },
  { key: 'social_mcp_url', value: 'http://127.0.0.1:8003/score', updated_at: '2024-04-10T10:00:00' },
];

const MOCK_AUDIT_LOGS = [
  { id: 'log_001', user_id: 'admin_001', action: 'review_claim', entity: 'claim', entity_id: 'clm_001', new_data: { decision: 'approve' }, created_at: '2024-04-15T10:35:00' },
  { id: 'log_002', user_id: 'admin_001', action: 'update_config', entity: 'system_config', entity_id: 'claim_threshold', old_data: { value: '0.4' }, new_data: { value: '0.5' }, created_at: '2024-04-10T10:00:00' },
  { id: 'log_003', user_id: 'admin_001', action: 'create_policy', entity: 'policy', entity_id: 'pol_003', new_data: { worker_id: 'w003', coverage_type: 'traffic' }, created_at: '2024-04-05T09:00:00' },
];

// ── Admin API Functions ───────────────────────────────────────────

export async function adminGetDashboard() {
  if (USE_MOCK) {
    await delay(600);
    return MOCK_DASHBOARD;
  }
  return await fetchAPI('/admin/dashboard');
}

export async function adminGetWorkers() {
  if (USE_MOCK) {
    await delay(500);
    return MOCK_WORKERS;
  }
  return await fetchAPI('/admin/workers');
}

export async function adminGetWorker(workerId) {
  if (USE_MOCK) {
    await delay(400);
    const worker = MOCK_WORKERS.find(w => w.id === workerId);
    if (!worker) throw new Error('Worker not found');
    return {
      ...worker,
      phone: '+91 98765 43210',
      gps_lat: 13.08,
      gps_lon: 80.27,
      daily_income_estimate: 1000,
      policies: MOCK_POLICIES.filter(p => p.worker_id === workerId),
      claims: MOCK_CLAIMS.filter(c => c.worker_id === workerId),
    };
  }
  return await fetchAPI(`/admin/workers/${workerId}`);
}

export async function adminGetPolicies(status = null, zone = null) {
  if (USE_MOCK) {
    await delay(500);
    let result = [...MOCK_POLICIES];
    if (status) result = result.filter(p => p.status === status);
    if (zone) result = result.filter(p => p.worker_zone?.includes(zone));
    return result;
  }
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (zone) params.set('zone', zone);
  const qs = params.toString();
  return await fetchAPI(`/admin/policies${qs ? '?' + qs : ''}`);
}

export async function adminCreatePolicy(data) {
  if (USE_MOCK) {
    await delay(800);
    const newPolicy = {
      id: 'pol_' + Date.now().toString(36),
      ...data,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + data.coverage_days * 86400000).toISOString().split('T')[0],
    };
    MOCK_POLICIES.unshift(newPolicy);
    return newPolicy;
  }
  return await fetchAPI('/admin/policies/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminGetClaims(status = null, zone = null) {
  if (USE_MOCK) {
    await delay(500);
    let result = [...MOCK_CLAIMS];
    if (status) result = result.filter(c => c.status === status);
    if (zone) result = result.filter(c => c.zone?.includes(zone));
    return result;
  }
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (zone) params.set('zone', zone);
  const qs = params.toString();
  return await fetchAPI(`/admin/claims${qs ? '?' + qs : ''}`);
}

export async function adminGetClaim(claimId) {
  if (USE_MOCK) {
    await delay(400);
    const claim = MOCK_CLAIMS.find(c => c.id === claimId);
    if (!claim) throw new Error('Claim not found');
    return {
      ...claim,
      policy_id: 'pol_001',
      claim_triggered: true,
      confidence: 'MEDIUM',
      weather_score: 0.45,
      traffic_score: 0.72,
      social_score: 0.10,
      fused_score: 0.55,
      reasoning_source: 'openai',
      explanation: 'High traffic disruption detected in zone. Worker GPS matches claim location. Moderate confidence in claim validity.',
      recommended_action: 'approve',
      fraud_check: {
        gps_valid: true,
        multi_server_confirmed: true,
        fraud_score: claim.fraud_score,
        verdict: claim.fraud_verdict,
        details: 'GPS coordinates verified. Multiple MCP servers agree on risk level.',
      },
      reviews: [],
    };
  }
  return await fetchAPI(`/admin/claims/${claimId}`);
}

export async function adminReviewClaim(claimId, decision, notes = '') {
  if (USE_MOCK) {
    await delay(800);
    const idx = MOCK_CLAIMS.findIndex(c => c.id === claimId);
    if (idx !== -1) {
      MOCK_CLAIMS[idx].status = decision === 'approve' ? 'approved' : 'rejected';
      if (decision === 'approve') {
        MOCK_CLAIMS[idx].payout_amount = Math.floor(Math.random() * 400 + 200);
      }
    }
    return { message: `Claim ${decision}d successfully`, claim_id: claimId };
  }
  return await fetchAPI(`/admin/claims/${claimId}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, notes }),
  });
}

export async function adminGetFraudAlerts(resolved = null) {
  if (USE_MOCK) {
    await delay(500);
    let result = [...MOCK_FRAUD_ALERTS];
    if (resolved !== null) result = result.filter(a => a.is_resolved === resolved);
    return result;
  }
  const params = new URLSearchParams();
  if (resolved !== null) params.set('resolved', resolved);
  const qs = params.toString();
  return await fetchAPI(`/admin/fraud-alerts${qs ? '?' + qs : ''}`);
}

export async function adminResolveFraudAlert(alertId) {
  if (USE_MOCK) {
    await delay(500);
    const idx = MOCK_FRAUD_ALERTS.findIndex(a => a.id === alertId);
    if (idx !== -1) MOCK_FRAUD_ALERTS[idx].is_resolved = true;
    return { message: 'Alert resolved' };
  }
  return await fetchAPI(`/admin/fraud-alerts/${alertId}/resolve`, { method: 'POST' });
}

export async function adminGetZoneRisk() {
  if (USE_MOCK) {
    await delay(500);
    const getLevel = (score) => score >= 0.6 ? 'HIGH' : score >= 0.35 ? 'MEDIUM' : 'LOW';
    return MOCK_ZONE_RISK.map(z => ({
      ...z,
      weather_level: getLevel(z.avg_weather),
      traffic_level: getLevel(z.avg_traffic),
      social_level: getLevel(z.avg_social),
    }));
  }
  return await fetchAPI('/admin/risk');
}

export async function adminGetAnalytics() {
  if (USE_MOCK) {
    await delay(700);
    return MOCK_ANALYTICS;
  }
  return await fetchAPI('/admin/analytics');
}

export async function adminGetConfig() {
  if (USE_MOCK) {
    await delay(400);
    return MOCK_CONFIG;
  }
  return await fetchAPI('/admin/config');
}

export async function adminUpdateConfig(configs) {
  if (USE_MOCK) {
    await delay(600);
    configs.forEach(({ key, value }) => {
      const idx = MOCK_CONFIG.findIndex(c => c.key === key);
      if (idx !== -1) {
        MOCK_CONFIG[idx].value = String(value);
        MOCK_CONFIG[idx].updated_at = new Date().toISOString();
      }
    });
    return { updated: configs };
  }
  return await fetchAPI('/admin/config', {
    method: 'PUT',
    body: JSON.stringify({ configs }),
  });
}

export async function adminGetAuditLogs() {
  if (USE_MOCK) {
    await delay(500);
    return MOCK_AUDIT_LOGS;
  }
  return await fetchAPI('/admin/audit-logs');
}
