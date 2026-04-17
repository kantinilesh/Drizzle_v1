// ========================================
// DRIZZLE MOCK DATA
// ========================================

export const ZONES = [
  'OMR-Chennai',
  'T.Nagar-Chennai',
  'Anna Nagar-Chennai',
  'Adyar-Chennai',
  'Velachery-Chennai',
  'Tambaram-Chennai',
  'Porur-Chennai',
  'Guindy-Chennai',
];

export const VEHICLE_TYPES = [
  { value: 'bike', label: '🏍️ Bike' },
  { value: 'scooter', label: '🛵 Scooter' },
  { value: 'bicycle', label: '🚲 Bicycle' },
  { value: 'auto', label: '🛺 Auto' },
];

export const INCOME_RANGES = [
  '₹400 - ₹800',
  '₹800 - ₹1200',
  '₹1200 - ₹1800',
  '₹1800 - ₹2500',
  '₹2500+',
];

export const COVERAGE_TYPES = [
  { value: 'weather', label: 'Weather Only', icon: '🌧️' },
  { value: 'traffic', label: 'Traffic Only', icon: '🚦' },
  { value: 'social', label: 'Social Only', icon: '📢' },
  { value: 'comprehensive', label: 'Comprehensive', icon: '🛡️' },
];

export const COVERAGE_DURATIONS = [
  { value: 30, label: '30 Days' },
  { value: 60, label: '60 Days' },
  { value: 90, label: '90 Days' },
];

export const SUM_INSURED_OPTIONS = [5000, 10000, 15000, 25000, 35000, 50000];

// ── Mock User ──
export const MOCK_USER = {
  id: 'usr_a1b2c3d4',
  full_name: 'Rahul Kumar',
  email: 'rahul@test.com',
  phone: '9876543210',
  role: 'worker',
  profile_completed: true,
  vehicle_type: 'bike',
  zone: 'OMR-Chennai',
  gps_lat: 13.08,
  gps_lon: 80.27,
  daily_income_estimate: 1000,
  total_claims: 3,
  total_payout: 600,
  created_at: '2026-01-01',
};

// ── Mock Risk Data ──
export const MOCK_RISK = {
  weather: { score: 0.72, level: 'HIGH', description: 'Heavy rainfall expected' },
  traffic: { score: 0.55, level: 'MEDIUM', description: 'Moderate congestion on OMR' },
  social: { score: 0.10, level: 'LOW', description: 'No events detected' },
  overall: { score: 0.62, level: 'HIGH' },
  last_updated: new Date().toISOString(),
};

// ── Mock Policies ──
export const MOCK_POLICIES = [
  {
    policy_id: 'pol_001',
    coverage_type: 'comprehensive',
    coverage_type_label: 'Comprehensive',
    sum_insured: 35000,
    premium: 1207,
    duration_days: 30,
    start_date: '2026-01-01',
    end_date: '2026-01-30',
    status: 'active',
    zone: 'OMR-Chennai',
    claims_count: 2,
    total_claimed: 600,
  },
  {
    policy_id: 'pol_002',
    coverage_type: 'weather',
    coverage_type_label: 'Weather Only',
    sum_insured: 10000,
    premium: 420,
    duration_days: 30,
    start_date: '2025-11-01',
    end_date: '2025-11-30',
    status: 'expired',
    zone: 'OMR-Chennai',
    claims_count: 1,
    total_claimed: 180,
  },
  {
    policy_id: 'pol_003',
    coverage_type: 'traffic',
    coverage_type_label: 'Traffic Only',
    sum_insured: 15000,
    premium: 550,
    duration_days: 60,
    start_date: '2025-09-01',
    end_date: '2025-10-30',
    status: 'expired',
    zone: 'OMR-Chennai',
    claims_count: 0,
    total_claimed: 0,
  },
];

// ── Mock Claims ──
export const MOCK_CLAIMS = [
  {
    claim_id: 'clm_001',
    policy_id: 'pol_001',
    cause: 'Weather',
    cause_icon: '🌧️',
    weather_score: 0.72,
    traffic_score: 0.55,
    social_score: 0.10,
    confidence: 'HIGH',
    fraud_check: 'Clean',
    payout: 420,
    status: 'approved',
    created_at: '2026-01-14',
    description: 'Heavy rainfall detected in OMR zone. Auto-triggered claim based on weather score threshold.',
  },
  {
    claim_id: 'clm_002',
    policy_id: 'pol_001',
    cause: 'Traffic',
    cause_icon: '🚦',
    weather_score: 0.30,
    traffic_score: 0.78,
    social_score: 0.05,
    confidence: 'HIGH',
    fraud_check: 'Clean',
    payout: 180,
    status: 'approved',
    created_at: '2026-01-10',
    description: 'Major traffic congestion on OMR due to road work. Automated claim processed.',
  },
  {
    claim_id: 'clm_003',
    policy_id: 'pol_001',
    cause: 'Social',
    cause_icon: '📢',
    weather_score: 0.15,
    traffic_score: 0.20,
    social_score: 0.45,
    confidence: 'LOW',
    fraud_check: 'Flagged',
    payout: 0,
    status: 'rejected',
    created_at: '2026-01-08',
    description: 'Social disruption signal detected but confidence below threshold.',
  },
];

// ── Mock Notifications ──
export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif_001',
    icon: '⚡',
    title: 'Claim Approved',
    message: '₹420 credited to your account for weather claim.',
    is_read: false,
    created_at: '2026-01-14T10:30:00',
    type: 'claim',
  },
  {
    id: 'notif_002',
    icon: '🌧️',
    title: 'Heavy Rain Detected',
    message: 'Weather risk is HIGH in your zone. Stay safe!',
    is_read: false,
    created_at: '2026-01-14T08:00:00',
    type: 'risk',
  },
  {
    id: 'notif_003',
    icon: '📄',
    title: 'Policy Expiring Soon',
    message: 'Your Comprehensive policy expires on Jan 30.',
    is_read: true,
    created_at: '2026-01-13T12:00:00',
    type: 'policy',
  },
  {
    id: 'notif_004',
    icon: '🚦',
    title: 'Traffic Alert',
    message: 'Moderate traffic congestion detected on OMR.',
    is_read: true,
    created_at: '2026-01-12T14:00:00',
    type: 'risk',
  },
  {
    id: 'notif_005',
    icon: '✅',
    title: 'Profile Updated',
    message: 'Your worker profile has been updated successfully.',
    is_read: true,
    created_at: '2026-01-01T09:00:00',
    type: 'system',
  },
];

// ── Premium Calculation ──
export function calculatePremium(coverageType, durationDays, sumInsured) {
  const baseRates = {
    weather: 0.035,
    traffic: 0.03,
    social: 0.025,
    comprehensive: 0.045,
  };
  const durationMultiplier = {
    30: 1,
    60: 1.8,
    90: 2.5,
  };
  const rate = baseRates[coverageType] || 0.04;
  const multiplier = durationMultiplier[durationDays] || 1;
  return Math.round(sumInsured * rate * multiplier);
}
