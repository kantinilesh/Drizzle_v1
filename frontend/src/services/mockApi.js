// ========================================
// DRIZZLE MOCK API SERVICE
// Simulates backend with localStorage + delays
// ========================================

import {
  MOCK_USER,
  MOCK_RISK,
  MOCK_POLICIES,
  MOCK_CLAIMS,
  MOCK_NOTIFICATIONS,
  calculatePremium,
} from './mockData';

const delay = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms));

// ── Auth ──

export async function apiLogin(email, password) {
  await delay(800);
  if (email && password) {
    const user = { ...MOCK_USER, email };
    localStorage.setItem('drizzle_token', 'jwt_mock_token_' + Date.now());
    localStorage.setItem('drizzle_user', JSON.stringify(user));
    return { token: 'jwt_mock_token', user };
  }
  throw new Error('Invalid credentials');
}

export async function apiSignup(fullName, email, phone, password) {
  await delay(800);
  if (fullName && email && password) {
    const user = {
      ...MOCK_USER,
      id: 'usr_' + Date.now(),
      full_name: fullName,
      email,
      phone,
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

export async function apiGetMe() {
  await delay(300);
  const userStr = localStorage.getItem('drizzle_user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  throw new Error('Not authenticated');
}

export function apiLogout() {
  localStorage.removeItem('drizzle_token');
  localStorage.removeItem('drizzle_user');
}

export function isAuthenticated() {
  return !!localStorage.getItem('drizzle_token');
}

// ── Worker Profile ──

export async function apiSaveProfile(profileData) {
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

// ── Risk ──

export async function apiGetRisk() {
  await delay(500);
  // Add some randomness
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

// ── Policies ──

export async function apiCalculatePremium(coverageType, durationDays, sumInsured) {
  await delay(400);
  return { premium: calculatePremium(coverageType, durationDays, sumInsured) };
}

export async function apiCreatePolicy(coverageType, durationDays, sumInsured) {
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

  // Store in localStorage
  const existingStr = localStorage.getItem('drizzle_policies');
  const existing = existingStr ? JSON.parse(existingStr) : [...MOCK_POLICIES];
  existing.unshift(policy);
  localStorage.setItem('drizzle_policies', JSON.stringify(existing));

  return policy;
}

export async function apiGetPolicies() {
  await delay(500);
  const stored = localStorage.getItem('drizzle_policies');
  if (stored) return JSON.parse(stored);
  return [...MOCK_POLICIES];
}

export async function apiGetPolicy(policyId) {
  await delay(300);
  const policies = await apiGetPolicies();
  const policy = policies.find(p => p.policy_id === policyId);
  if (!policy) throw new Error('Policy not found');
  return policy;
}

// ── Claims ──

export async function apiGetClaims() {
  await delay(500);
  return [...MOCK_CLAIMS];
}

export async function apiGetClaim(claimId) {
  await delay(300);
  const claim = MOCK_CLAIMS.find(c => c.claim_id === claimId);
  if (!claim) throw new Error('Claim not found');
  return claim;
}

// ── Notifications ──

export async function apiGetNotifications() {
  await delay(400);
  const stored = localStorage.getItem('drizzle_notifications');
  if (stored) return JSON.parse(stored);
  return [...MOCK_NOTIFICATIONS];
}

export async function apiMarkNotificationRead(notifId) {
  await delay(200);
  const notifs = await apiGetNotifications();
  const updated = notifs.map(n => n.id === notifId ? { ...n, is_read: true } : n);
  localStorage.setItem('drizzle_notifications', JSON.stringify(updated));
  return updated;
}
