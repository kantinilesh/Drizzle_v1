// ========================================
// DRIZZLE WORKER API SERVICE
// Connects to FastAPI backend (/api/v1/...)
// Falls back to mock data when VITE_API_URL is not set
// ========================================

import {
  MOCK_USER,
  MOCK_RISK,
  MOCK_POLICIES,
  MOCK_CLAIMS,
  MOCK_NOTIFICATIONS,
  calculatePremium,
} from './mockData';

const browserHost =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';

const defaultApiBaseUrl =
  browserHost === 'localhost' || browserHost === '127.0.0.1'
    ? `${window.location.protocol}//${browserHost}:8000`
    : '';

export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiBaseUrl;
export const USE_MOCK = !API_BASE_URL;

const delay = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeAuthUser(payload = {}) {
  return {
    user_id: payload.user_id ?? payload.id ?? null,
    id: payload.id ?? payload.user_id ?? null,
    email: payload.email ?? '',
    full_name: payload.full_name ?? '',
    phone: payload.phone ?? '',
    role: payload.role ?? 'worker',
    profile_completed: Boolean(payload.profile_completed),
  };
}

function formatCoverageTypeLabel(coverageType = '') {
  const labels = {
    comprehensive: 'Comprehensive',
    weather: 'Weather Only',
    traffic: 'Traffic Only',
    social: 'Social Only',
    standard: 'Standard',
    premium: 'Premium',
  };
  return labels[coverageType] || coverageType || 'Policy';
}

function normalizePolicy(policy = {}) {
  return {
    ...policy,
    policy_id: policy.policy_id ?? policy.id,
    coverage_type_label: policy.coverage_type_label ?? formatCoverageTypeLabel(policy.coverage_type),
    duration_days: policy.duration_days ?? policy.coverage_days ?? 0,
    claims_count: policy.claims_count ?? 0,
    total_claimed: policy.total_claimed ?? 0,
    zone: policy.zone ?? '',
  };
}

function normalizeClaim(claim = {}) {
  const cause = claim.cause ?? claim.primary_cause ?? 'Risk';
  const causeIcon = {
    Weather: '🌧️',
    Traffic: '🚦',
    Social: '📢',
    Risk: '⚠️',
  }[cause] || '⚠️';

  return {
    ...claim,
    claim_id: claim.claim_id ?? claim.id,
    policy_id: claim.policy_id ?? claim.policy?.id ?? '',
    cause,
    cause_icon: claim.cause_icon ?? causeIcon,
    payout: claim.payout ?? claim.payout_amount ?? 0,
    fraud_check: claim.fraud_check ?? claim.fraud_verdict ?? '—',
  };
}

// ── Fetch helper ──────────────────────────────────────────────────
export async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('drizzle_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Unable to reach the API at ${API_BASE_URL || 'the current origin'}. ` +
        'Make sure the backend is running and that CORS allows your frontend URL.'
      );
    }
    throw error;
  }

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch (e) { /* ignore */ }
    throw new Error(errorMsg);
  }

  return response.json();
}

// ── Auth ──────────────────────────────────────────────────────────

export async function apiLogin(email, password) {
  if (USE_MOCK) {
    await delay(800);
    if (email && password) {
      const user = { ...MOCK_USER, email };
      localStorage.setItem('drizzle_token', 'jwt_mock_token_' + Date.now());
      localStorage.setItem('drizzle_user', JSON.stringify(user));
      return { token: 'jwt_mock_token', user };
    }
    throw new Error('Invalid credentials');
  }

  const data = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    localStorage.setItem('drizzle_token', data.token);
    const user = data.user ? normalizeAuthUser(data.user) : normalizeAuthUser(data);
    localStorage.setItem('drizzle_user', JSON.stringify(user));
    return { ...data, user };
  }
  return data;
}

export async function apiSignup(fullName, email, phone, password) {
  if (USE_MOCK) {
    await delay(800);
    if (fullName && email && password) {
      const user = {
        ...MOCK_USER,
        id: 'usr_' + Date.now(),
        full_name: fullName,
        email,
        phone,
        role: 'worker',
        profile_completed: false,
        total_claims: 0,
        total_payout: 0,
      };
      localStorage.setItem('drizzle_token', 'jwt_mock_token_' + Date.now());
      localStorage.setItem('drizzle_user', JSON.stringify(user));
      return { user_id: user.id, role: 'worker', message: 'User created' };
    }
    throw new Error('All fields are required');
  }

  const data = await fetchAPI('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ full_name: fullName, email, phone, password }),
  });
  // After signup, log them in automatically
  if (data.user_id) {
    const loginData = await apiLogin(email, password);
    return { ...data, ...loginData };
  }
  return data;
}

export async function apiGetMe() {
  if (USE_MOCK) {
    await delay(300);
    const userStr = localStorage.getItem('drizzle_user');
    if (userStr) return JSON.parse(userStr);
    throw new Error('Not authenticated');
  }

  // Try /auth/me first, fallback to /workers/me for profile data
  try {
    const authUser = await fetchAPI('/auth/me');
    if (authUser.role === 'admin') {
      const normalized = normalizeAuthUser(authUser);
      localStorage.setItem('drizzle_user', JSON.stringify(normalized));
      return normalized;
    }
    // For workers, get richer profile data
    try {
      const workerData = await fetchAPI('/workers/me');
      const merged = { ...normalizeAuthUser(authUser), ...workerData, profile_completed: true };
      localStorage.setItem('drizzle_user', JSON.stringify(merged));
      return merged;
    } catch {
      const normalized = normalizeAuthUser(authUser);
      localStorage.setItem('drizzle_user', JSON.stringify(normalized));
      return normalized;
    }
  } catch (e) {
    throw e;
  }
}

export function apiLogout() {
  localStorage.removeItem('drizzle_token');
  localStorage.removeItem('drizzle_user');
}

export function isAuthenticated() {
  return !!localStorage.getItem('drizzle_token');
}

// ── Worker Profile ────────────────────────────────────────────────

export async function apiSaveProfile(profileData) {
  if (USE_MOCK) {
    await delay(600);
    const userStr = localStorage.getItem('drizzle_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const updated = { ...user, ...profileData, profile_completed: true };
      localStorage.setItem('drizzle_user', JSON.stringify(updated));
      return updated;
    }
    throw new Error('Not authenticated');
  }

  const updatedUser = await fetchAPI('/workers/profile', {
    method: 'POST',
    body: JSON.stringify(profileData),
  });
  const currentUser = JSON.parse(localStorage.getItem('drizzle_user') || '{}');
  const merged = { ...currentUser, ...updatedUser, profile_completed: true };
  localStorage.setItem('drizzle_user', JSON.stringify(merged));
  return merged;
}

// ── Risk ──────────────────────────────────────────────────────────

export async function apiGetRisk() {
  if (USE_MOCK) {
    await delay(500);
    const jitter = () => (Math.random() - 0.5) * 0.1;
    const getLevel = (score) => {
      if (score >= 0.6) return 'HIGH';
      if (score >= 0.3) return 'MEDIUM';
      return 'LOW';
    };
    const weather = Math.min(1, Math.max(0, MOCK_RISK.weather.score + jitter()));
    const traffic = Math.min(1, Math.max(0, MOCK_RISK.traffic.score + jitter()));
    const social = Math.min(1, Math.max(0, MOCK_RISK.social.score + jitter()));
    const overall = (weather * 0.4 + traffic * 0.4 + social * 0.2);
    return {
      weather: { score: +weather.toFixed(2), level: getLevel(weather), description: MOCK_RISK.weather.description },
      traffic: { score: +traffic.toFixed(2), level: getLevel(traffic), description: MOCK_RISK.traffic.description },
      social: { score: +social.toFixed(2), level: getLevel(social), description: MOCK_RISK.social.description },
      overall: { score: +overall.toFixed(2), level: getLevel(overall) },
      last_updated: new Date().toISOString(),
    };
  }

  return await fetchAPI('/risk/live');
}

// ── Policies ──────────────────────────────────────────────────────

export async function apiCalculatePremium(coverageType, durationDays, sumInsured) {
  if (USE_MOCK) {
    await delay(400);
    return { premium: calculatePremium(coverageType, durationDays, sumInsured) };
  }

  return await fetchAPI('/policies/calculate', {
    method: 'POST',
    body: JSON.stringify({ coverage_type: coverageType, coverage_days: durationDays, sum_insured: sumInsured }),
  });
}

export async function apiCreatePolicy(coverageType, durationDays, sumInsured) {
  if (USE_MOCK) {
    await delay(1000);
    const premium = calculatePremium(coverageType, durationDays, sumInsured);
    const labels = { weather: 'Weather Only', traffic: 'Traffic Only', social: 'Social Only', comprehensive: 'Comprehensive' };
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + durationDays);
    const policy = {
      policy_id: 'pol_' + Date.now().toString(36),
      coverage_type: coverageType,
      coverage_type_label: labels[coverageType] || coverageType,
      sum_insured: sumInsured,
      premium,
      duration_days: durationDays,
      start_date: now.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      status: 'active',
      zone: JSON.parse(localStorage.getItem('drizzle_user') || '{}').zone || 'OMR-Chennai',
      claims_count: 0,
      total_claimed: 0,
    };
    const existingStr = localStorage.getItem('drizzle_policies');
    const existing = existingStr ? JSON.parse(existingStr) : [...MOCK_POLICIES];
    existing.unshift(policy);
    localStorage.setItem('drizzle_policies', JSON.stringify(existing));
    return policy;
  }

  return await fetchAPI('/policies/create', {
    method: 'POST',
    body: JSON.stringify({ coverage_type: coverageType, coverage_days: durationDays, sum_insured: sumInsured }),
  });
}

export async function apiGetPolicies() {
  if (USE_MOCK) {
    await delay(500);
    const stored = localStorage.getItem('drizzle_policies');
    if (stored) return JSON.parse(stored);
    return [...MOCK_POLICIES];
  }

  try {
    const policies = await fetchAPI('/policies/my');
    return Array.isArray(policies) ? policies.map(normalizePolicy) : [];
  } catch (error) {
    if (error.message?.includes('Worker profile not found')) {
      return [];
    }
    throw error;
  }
}

export async function apiGetPolicy(policyId) {
  if (USE_MOCK) {
    await delay(300);
    const policies = await apiGetPolicies();
    const policy = policies.find(p => p.policy_id === policyId || p.id === policyId);
    if (!policy) throw new Error('Policy not found');
    return policy;
  }

  return normalizePolicy(await fetchAPI(`/policies/${policyId}`));
}

// ── Claims ────────────────────────────────────────────────────────

export async function apiTriggerClaim(policyId, lat, lon) {
  if (USE_MOCK) {
    await delay(1500);
    return {
      claim_id: 'clm_' + Date.now().toString(36),
      claim_triggered: true,
      confidence: 'HIGH',
      payout: Math.floor(Math.random() * 500 + 200),
    };
  }

  return await fetchAPI('/claims/trigger', {
    method: 'POST',
    body: JSON.stringify({ policy_id: policyId, lat, lon }),
  });
}

export async function apiGetClaims() {
  if (USE_MOCK) {
    await delay(500);
    return [...MOCK_CLAIMS];
  }

  try {
    const data = await fetchAPI('/claims/my');
    const claims = Array.isArray(data) ? data : (data.claims || []);
    return claims.map(normalizeClaim);
  } catch (error) {
    if (error.message?.includes('Worker profile not found')) {
      return [];
    }
    throw error;
  }
}

export async function apiGetClaim(claimId) {
  if (USE_MOCK) {
    await delay(300);
    const claim = MOCK_CLAIMS.find(c => c.claim_id === claimId);
    if (!claim) throw new Error('Claim not found');
    return claim;
  }

  return normalizeClaim(await fetchAPI(`/claims/${claimId}`));
}

// ── Notifications ─────────────────────────────────────────────────

export async function apiGetNotifications() {
  if (USE_MOCK) {
    await delay(400);
    const stored = localStorage.getItem('drizzle_notifications');
    if (stored) return JSON.parse(stored);
    return [...MOCK_NOTIFICATIONS];
  }

  return await fetchAPI('/notifications');
}

export async function apiMarkNotificationRead(notifId) {
  if (USE_MOCK) {
    await delay(200);
    const notifs = await apiGetNotifications();
    const updated = notifs.map(n => n.id === notifId ? { ...n, is_read: true } : n);
    localStorage.setItem('drizzle_notifications', JSON.stringify(updated));
    return updated;
  }

  return await fetchAPI(`/notifications/read/${notifId}`, { method: 'POST' });
}
