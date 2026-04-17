import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { adminGetPolicies, adminCreatePolicy, adminGetWorkers, adminGetDashboard } from '../services/adminApi';
import { fetchAPI, USE_MOCK } from '../services/api';

const calculatePremiumLocal = (coverage, days, sum) => {
  const base = { comprehensive: 0.04, weather: 0.025, traffic: 0.02, social: 0.015 };
  return Math.round(sum * (base[coverage] || 0.03) * (days / 30));
};

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    adminGetPolicies(statusFilter || null, zoneFilter || null)
      .then(setPolicies)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, zoneFilter]);

  const zones = [...new Set(policies.map(p => p.worker_zone).filter(Boolean))];

  return (
    <AdminLayout pageTitle="🛡️ Policies">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Policy Management</div>
          <div className="admin-page-subtitle">{policies.length} total policies</div>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowCreate(true)}>
          ➕ Create Policy
        </button>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">All Policies</div>
          <div className="admin-table-filters">
            <select className="admin-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="admin-filter-select" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}>
              <option value="">All Zones</option>
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /><span>Loading policies…</span></div>
        ) : policies.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🛡️</div>
            <div className="admin-empty-text">No policies found</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Policy ID</th>
                <th>Worker</th>
                <th>Zone</th>
                <th>Coverage</th>
                <th>Days</th>
                <th>Sum Insured</th>
                <th>Premium</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {policies.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--admin-text-2)' }}>
                    {p.id?.slice(0, 10)}…
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.worker_name || '—'}</td>
                  <td style={{ color: 'var(--admin-text-2)' }}>{p.worker_zone || '—'}</td>
                  <td>
                    <span className="admin-badge badge-info">{p.coverage_type}</span>
                  </td>
                  <td style={{ color: 'var(--admin-text-2)' }}>{p.coverage_days}</td>
                  <td style={{ fontWeight: 600 }}>₹{(p.sum_insured || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: 'var(--admin-success)' }}>₹{(p.premium || 0).toLocaleString()}</td>
                  <td>
                    <span className={`admin-badge ${
                      p.status === 'active' ? 'badge-success' :
                      p.status === 'expired' ? 'badge-gray' : 'badge-danger'
                    }`}>{p.status}</span>
                  </td>
                  <td style={{ color: 'var(--admin-text-2)', fontSize: '0.78rem' }}>{p.start_date || '—'}</td>
                  <td style={{ color: 'var(--admin-text-2)', fontSize: '0.78rem' }}>{p.end_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && (
          <div className="admin-table-footer">Showing {policies.length} policies</div>
        )}
      </div>

      {/* Create Policy Modal */}
      {showCreate && (
        <CreatePolicyModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); load(); }}
        />
      )}
    </AdminLayout>
  );
}

function CreatePolicyModal({ onClose, onSuccess }) {
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState({
    worker_id: '',
    coverage_type: 'comprehensive',
    coverage_days: 30,
    sum_insured: 35000,
    premium: 0,
    zone_multiplier: 1.0,
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    adminGetWorkers().then(setWorkers).catch(console.error);
  }, []);

  useEffect(() => {
    if (form.sum_insured && form.coverage_days) {
      const premium = calculatePremiumLocal(form.coverage_type, parseInt(form.coverage_days), parseFloat(form.sum_insured));
      setForm(f => ({ ...f, premium }));
    }
  }, [form.coverage_type, form.coverage_days, form.sum_insured]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.worker_id) { setToast('Please select a worker'); return; }
    setLoading(true);
    try {
      await adminGetPolicies(); // preflight
      const { adminCreatePolicy: create } = await import('../services/adminApi');
      await create({
        worker_id: form.worker_id,
        coverage_type: form.coverage_type,
        coverage_days: parseInt(form.coverage_days),
        sum_insured: parseFloat(form.sum_insured),
        premium: parseFloat(form.premium),
        zone_multiplier: parseFloat(form.zone_multiplier),
      });
      onSuccess();
    } catch (e) {
      setToast(e.message || 'Failed to create policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal-title">➕ Create Policy</div>
        <div className="admin-modal-sub">Manually create a policy for a registered worker</div>

        {toast && <div className="admin-error-msg">⚠️ {toast}</div>}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">Worker</label>
            <select
              className="admin-form-select"
              value={form.worker_id}
              onChange={e => setForm(f => ({ ...f, worker_id: e.target.value }))}
              required
            >
              <option value="">Select a worker…</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.full_name} — {w.zone}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Coverage Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['weather', 'traffic', 'social', 'comprehensive'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, coverage_type: t }))}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: form.coverage_type === t ? 'var(--admin-primary)' : 'var(--admin-border)',
                    background: form.coverage_type === t ? 'var(--admin-primary-dim)' : 'var(--admin-bg-3)',
                    color: form.coverage_type === t ? 'var(--admin-primary)' : 'var(--admin-text-2)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontFamily: 'var(--admin-font)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-grid-2" style={{ gap: '12px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Duration (days)</label>
              <input
                type="number"
                className="admin-form-input"
                value={form.coverage_days}
                onChange={e => setForm(f => ({ ...f, coverage_days: e.target.value }))}
                min="1"
                max="365"
                required
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Sum Insured (₹)</label>
              <input
                type="number"
                className="admin-form-input"
                value={form.sum_insured}
                onChange={e => setForm(f => ({ ...f, sum_insured: e.target.value }))}
                min="1000"
                required
              />
            </div>
          </div>

          <div style={{
            padding: '14px',
            background: 'var(--admin-success-dim)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--admin-success)', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Calculated Premium
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--admin-success)' }}>
              ₹{form.premium.toLocaleString()}
            </div>
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
