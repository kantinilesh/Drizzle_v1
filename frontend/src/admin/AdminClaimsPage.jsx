import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { adminGetClaims, adminGetClaim, adminReviewClaim } from '../services/adminApi';

// ── Claims List ────────────────────────────────────────────────────

export function AdminClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    adminGetClaims(statusFilter || null, zoneFilter || null)
      .then(setClaims)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, zoneFilter]);

  const zones = [...new Set(claims.map(c => c.zone).filter(Boolean))];

  const getStatusBadge = (status) => {
    const map = {
      approved: 'badge-success',
      rejected: 'badge-danger',
      pending: 'badge-warning',
      flagged: 'badge-fraud',
    };
    return map[status] || 'badge-gray';
  };

  const getFraudBadge = (verdict) => {
    if (verdict === 'clean') return 'badge-success';
    if (verdict === 'suspicious') return 'badge-fraud';
    return 'badge-gray';
  };

  return (
    <AdminLayout pageTitle="🚨 Claims">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Claim Management</div>
          <div className="admin-page-subtitle">
            {claims.filter(c => c.status === 'pending' || c.status === 'flagged').length} claims need review
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="admin-badge badge-warning" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
            Pending: {claims.filter(c => c.status === 'pending').length}
          </span>
          <span className="admin-badge badge-fraud" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
            Flagged: {claims.filter(c => c.status === 'flagged').length}
          </span>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">All Claims</div>
          <div className="admin-table-filters">
            <select className="admin-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="flagged">Flagged</option>
            </select>
            <select className="admin-filter-select" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}>
              <option value="">All Zones</option>
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /><span>Loading claims…</span></div>
        ) : claims.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🚨</div>
            <div className="admin-empty-text">No claims found</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Worker</th>
                <th>Zone</th>
                <th>Cause</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Fraud</th>
                <th>Payout</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--admin-text-2)' }}>
                    {c.id?.slice(0, 10)}…
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.worker_name || '—'}</td>
                  <td style={{ color: 'var(--admin-text-2)', fontSize: '0.8rem' }}>{c.zone || '—'}</td>
                  <td>
                    {c.primary_cause && (
                      <span className="admin-badge badge-info">{c.primary_cause}</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '4px', background: 'var(--admin-bg-3)', borderRadius: '2px', minWidth: '60px' }}>
                        <div style={{
                          height: '100%',
                          width: `${(c.fused_score || 0) * 100}%`,
                          borderRadius: '2px',
                          background: (c.fused_score || 0) >= 0.6 ? 'var(--admin-danger)' :
                            (c.fused_score || 0) >= 0.35 ? 'var(--admin-warning)' : 'var(--admin-success)',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-2)', minWidth: '32px' }}>
                        {((c.fused_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${getStatusBadge(c.status)}`}>{c.status}</span>
                  </td>
                  <td>
                    <span className={`admin-badge ${getFraudBadge(c.fraud_verdict)}`}>
                      {c.fraud_verdict || 'unknown'}
                      {c.fraud_score != null && ` · ${(c.fraud_score * 100).toFixed(0)}%`}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: c.payout_amount > 0 ? 'var(--admin-success)' : 'var(--admin-text-2)' }}>
                    {c.payout_amount > 0 ? `₹${c.payout_amount}` : '—'}
                  </td>
                  <td style={{ color: 'var(--admin-text-2)', fontSize: '0.75rem' }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button
                      className={`admin-btn admin-btn-sm ${
                        c.status === 'pending' || c.status === 'flagged'
                          ? 'admin-btn-primary'
                          : 'admin-btn-ghost'
                      }`}
                      onClick={() => navigate(`/admin/claims/${c.id}`)}
                    >
                      {c.status === 'pending' || c.status === 'flagged' ? '⚡ Review' : 'View →'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && (
          <div className="admin-table-footer">
            {claims.length} total claims · {claims.filter(c => c.status === 'approved').length} approved · {claims.filter(c => c.status === 'rejected').length} rejected
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ── Claim Review Detail ────────────────────────────────────────────

export function AdminClaimDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    adminGetClaim(id)
      .then(setClaim)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleReview = async (decision) => {
    setReviewing(true);
    try {
      await adminReviewClaim(id, decision, notes);
      setToast({ text: `Claim ${decision}d successfully`, type: 'success' });
      load();
    } catch (e) {
      setToast({ text: e.message || 'Review failed', type: 'error' });
    } finally {
      setReviewing(false);
    }
  };

  const ScoreBar = ({ label, score, icon }) => {
    const color = score >= 0.6 ? 'red' : score >= 0.35 ? 'yellow' : 'green';
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-2)' }}>{icon} {label}</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: `var(--admin-${color === 'red' ? 'danger' : color === 'yellow' ? 'warning' : 'success'})` }}>
            {(score * 100).toFixed(0)}%
          </span>
        </div>
        <div style={{ height: '6px', background: 'var(--admin-bg-3)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${score * 100}%`,
            borderRadius: '3px',
            background: color === 'red' ? 'var(--admin-danger)' : color === 'yellow' ? 'var(--admin-warning)' : 'var(--admin-success)',
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout pageTitle="🚨 Claim Review">
        <div className="admin-loading"><div className="admin-spinner" /><span>Loading claim…</span></div>
      </AdminLayout>
    );
  }

  if (!claim) {
    return (
      <AdminLayout pageTitle="🚨 Claim Review">
        <div className="admin-empty">
          <div className="admin-empty-icon">❌</div>
          <div className="admin-empty-text">Claim not found</div>
        </div>
      </AdminLayout>
    );
  }

  const canReview = claim.status === 'pending' || claim.status === 'flagged';

  return (
    <AdminLayout pageTitle="🚨 Claim Review">
      <button className="admin-back-link" onClick={() => navigate('/admin/claims')}>
        ← Back to Claims
      </button>

      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Claim Review</div>
          <div className="admin-page-subtitle" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--admin-text-3)' }}>{claim.id}</span>
            <span className={`admin-badge ${
              claim.status === 'approved' ? 'badge-success' :
              claim.status === 'rejected' ? 'badge-danger' :
              claim.status === 'flagged' ? 'badge-fraud' : 'badge-warning'
            }`}>{claim.status}</span>
          </div>
        </div>
      </div>

      <div className="admin-grid-2" style={{ gap: '20px', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Basic Info */}
          <div className="admin-card">
            <div className="admin-card-title"><span>📋</span> Claim Info</div>
            <div className="detail-row"><span className="detail-label">Worker</span><span className="detail-value" style={{ fontWeight: 700 }}>{claim.worker_name || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Zone</span><span className="detail-value">{claim.zone || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Policy</span><span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{claim.policy_id?.slice(0, 12) || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Date</span><span className="detail-value">{claim.created_at ? new Date(claim.created_at).toLocaleString() : '—'}</span></div>
            <div className="detail-row">
              <span className="detail-label">Triggered</span>
              <span className="detail-value">
                <span className={`admin-badge ${claim.claim_triggered ? 'badge-success' : 'badge-gray'}`}>
                  {claim.claim_triggered ? 'YES' : 'NO'}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Confidence</span>
              <span className="detail-value">
                <span className={`admin-badge ${
                  claim.confidence === 'HIGH' ? 'badge-success' :
                  claim.confidence === 'MEDIUM' ? 'badge-warning' : 'badge-danger'
                }`}>{claim.confidence || '—'}</span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Primary Cause</span>
              <span className="detail-value">
                {claim.primary_cause && <span className="admin-badge badge-info">{claim.primary_cause}</span>}
              </span>
            </div>
          </div>

          {/* Risk Signals */}
          <div className="admin-card">
            <div className="admin-card-title"><span>📡</span> Risk Signals</div>
            {claim.weather_score != null && <ScoreBar label="Weather" score={claim.weather_score} icon="🌧️" />}
            {claim.traffic_score != null && <ScoreBar label="Traffic" score={claim.traffic_score} icon="🚦" />}
            {claim.social_score != null && <ScoreBar label="Social" score={claim.social_score} icon="📰" />}
            {claim.fused_score != null && (
              <>
                <div style={{ height: '1px', background: 'var(--admin-border)', margin: '12px 0' }} />
                <ScoreBar label="Fused Score" score={claim.fused_score} icon="⚡" />
              </>
            )}
          </div>

          {/* AI Reasoning */}
          {claim.explanation && (
            <div className="admin-card">
              <div className="admin-card-title"><span>🧠</span> AI Reasoning</div>
              <div style={{
                fontSize: '0.83rem',
                color: 'var(--admin-text-2)',
                lineHeight: '1.6',
                padding: '12px',
                background: 'var(--admin-bg-3)',
                borderRadius: '8px',
                border: '1px solid var(--admin-border)',
              }}>
                {claim.explanation}
              </div>
              {claim.recommended_action && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--admin-text-2)' }}>Recommended:</span>
                  <span className={`admin-badge ${claim.recommended_action === 'approve' ? 'badge-success' : 'badge-danger'}`}>
                    {claim.recommended_action?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Fraud Check */}
          {claim.fraud_check && (
            <div className="admin-card" style={{
              borderColor: (claim.fraud_check.fraud_score || 0) > 0.3 ? 'rgba(249, 115, 22, 0.3)' : 'var(--admin-border)',
            }}>
              <div className="admin-card-title"><span>🛡️</span> Fraud Check</div>
              <div className="detail-row">
                <span className="detail-label">GPS Valid</span>
                <span className="detail-value">
                  <span className={`admin-badge ${claim.fraud_check.gps_valid ? 'badge-success' : 'badge-danger'}`}>
                    {claim.fraud_check.gps_valid ? 'YES' : 'NO'}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Multi-Server</span>
                <span className="detail-value">
                  <span className={`admin-badge ${claim.fraud_check.multi_server_confirmed ? 'badge-success' : 'badge-danger'}`}>
                    {claim.fraud_check.multi_server_confirmed ? 'YES' : 'NO'}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fraud Score</span>
                <span className="detail-value">
                  <span className={`admin-badge ${
                    (claim.fraud_check.fraud_score || 0) > 0.4 ? 'badge-fraud' :
                    (claim.fraud_check.fraud_score || 0) > 0.2 ? 'badge-warning' : 'badge-success'
                  }`}>
                    {((claim.fraud_check.fraud_score || 0) * 100).toFixed(0)}%
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Verdict</span>
                <span className="detail-value">
                  <span className={`admin-badge ${claim.fraud_check.verdict === 'clean' ? 'badge-success' : 'badge-fraud'}`}>
                    {claim.fraud_check.verdict || '—'}
                  </span>
                </span>
              </div>
              {claim.fraud_check.details && (
                <div style={{
                  marginTop: '10px',
                  fontSize: '0.78rem',
                  color: 'var(--admin-text-2)',
                  padding: '10px',
                  background: 'var(--admin-bg-3)',
                  borderRadius: '6px',
                  lineHeight: '1.5',
                }}>
                  {claim.fraud_check.details}
                </div>
              )}
            </div>
          )}

          {/* Suggested Payout */}
          <div className="admin-card">
            <div className="admin-card-title"><span>💰</span> Payout</div>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                {claim.payout_amount > 0 ? 'Paid Out' : 'Suggested Payout'}
              </div>
              <div style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                color: claim.payout_amount > 0 ? 'var(--admin-success)' : 'var(--admin-text-2)',
              }}>
                {claim.payout_amount > 0 ? `₹${claim.payout_amount.toLocaleString()}` : '₹0'}
              </div>
            </div>
          </div>

          {/* Review Panel */}
          {canReview && (
            <div className="admin-card" style={{ border: '1px solid var(--admin-primary)', background: 'var(--admin-primary-dim)' }}>
              <div className="admin-card-title"><span>⚡</span> Admin Decision</div>
              <div className="admin-form-group">
                <label className="admin-form-label">Notes (optional)</label>
                <textarea
                  className="admin-form-textarea"
                  placeholder="Add review notes…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="admin-btn admin-btn-success"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleReview('approve')}
                  disabled={reviewing}
                  id="claim-approve-btn"
                >
                  {reviewing ? '⏳' : '✅'} Approve
                </button>
                <button
                  className="admin-btn admin-btn-danger"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleReview('reject')}
                  disabled={reviewing}
                  id="claim-reject-btn"
                >
                  {reviewing ? '⏳' : '❌'} Reject
                </button>
              </div>
            </div>
          )}

          {/* Previous Reviews */}
          {claim.reviews?.length > 0 && (
            <div className="admin-card">
              <div className="admin-card-title"><span>📜</span> Review History</div>
              {claim.reviews.map((r, i) => (
                <div key={i} style={{
                  padding: '10px',
                  background: 'var(--admin-bg-3)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: '1px solid var(--admin-border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className={`admin-badge ${r.decision === 'approve' ? 'badge-success' : 'badge-danger'}`}>
                      {r.decision?.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-3)' }}>
                      {r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : '—'}
                    </span>
                  </div>
                  {r.notes && <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-2)' }}>{r.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="admin-toast" style={{ borderColor: toast.type === 'success' ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.text}
          <button
            onClick={() => setToast(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--admin-text-2)', cursor: 'pointer', fontSize: '1rem' }}
          >×</button>
        </div>
      )}
    </AdminLayout>
  );
}
