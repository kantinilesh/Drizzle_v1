import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { adminGetWorkers, adminGetWorker } from '../services/adminApi';

// ── Worker List ────────────────────────────────────────────────────

export function AdminWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    adminGetWorkers()
      .then(setWorkers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const zones = [...new Set(workers.map(w => w.zone).filter(Boolean))];

  const filtered = workers.filter(w => {
    const matchSearch = !search || w.full_name?.toLowerCase().includes(search.toLowerCase()) || w.id?.includes(search);
    const matchZone = !zoneFilter || w.zone === zoneFilter;
    const matchStatus = !statusFilter || (w.status || 'active') === statusFilter;
    return matchSearch && matchZone && matchStatus;
  });

  return (
    <AdminLayout pageTitle="👷 Workers">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Worker Management</div>
          <div className="admin-page-subtitle">{workers.length} registered workers</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">All Workers</div>
          <div className="admin-table-filters">
            <div className="admin-search">
              <span>🔍</span>
              <input
                placeholder="Search name or ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="admin-filter-select"
              value={zoneFilter}
              onChange={e => setZoneFilter(e.target.value)}
            >
              <option value="">All Zones</option>
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <select
              className="admin-filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /><span>Loading workers…</span></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">👷</div>
            <div className="admin-empty-text">No workers found</div>
            <div className="admin-empty-sub">Try adjusting your filters</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Zone</th>
                <th>Vehicle</th>
                <th>Total Claims</th>
                <th>Total Payout</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id}>
                  <td style={{ color: 'var(--admin-text-2)', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    {w.id?.slice(0, 8)}…
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{w.full_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-3)' }}>
                      Joined {new Date(w.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ color: 'var(--admin-text-2)' }}>{w.zone || '—'}</td>
                  <td style={{ color: 'var(--admin-text-2)' }}>{w.vehicle_type || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{w.total_claims}</td>
                  <td style={{ fontWeight: 600, color: 'var(--admin-success)' }}>
                    ₹{(w.total_payout || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className={`admin-badge ${(w.status || 'active') === 'active' ? 'badge-success' : 'badge-gray'}`}>
                      {w.status || 'active'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      onClick={() => navigate(`/admin/workers/${w.id}`)}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && (
          <div className="admin-table-footer">
            Showing {filtered.length} of {workers.length} workers
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ── Worker Detail ──────────────────────────────────────────────────

export function AdminWorkerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetWorker(id)
      .then(setWorker)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AdminLayout pageTitle="👷 Worker Detail">
        <div className="admin-loading"><div className="admin-spinner" /><span>Loading worker…</span></div>
      </AdminLayout>
    );
  }

  if (!worker) {
    return (
      <AdminLayout pageTitle="👷 Worker Detail">
        <div className="admin-empty">
          <div className="admin-empty-icon">❌</div>
          <div className="admin-empty-text">Worker not found</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="👷 Worker Detail">
      <button className="admin-back-link" onClick={() => navigate('/admin/workers')}>
        ← Back to Workers
      </button>

      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">{worker.full_name}</div>
          <div className="admin-page-subtitle">
            <span className={`admin-badge ${(worker.status || 'active') === 'active' ? 'badge-success' : 'badge-gray'}`}>
              {worker.status || 'active'}
            </span>
            <span style={{ marginLeft: '8px', color: 'var(--admin-text-3)', fontSize: '0.8rem' }}>
              ID: {worker.id}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div className="admin-stat-card blue">
          <div className="admin-stat-label">Total Claims</div>
          <div className="admin-stat-value blue">{worker.total_claims}</div>
        </div>
        <div className="admin-stat-card green">
          <div className="admin-stat-label">Total Payout</div>
          <div className="admin-stat-value green">₹{(worker.total_payout || 0).toLocaleString()}</div>
        </div>
        <div className="admin-stat-card yellow">
          <div className="admin-stat-label">Daily Income Est.</div>
          <div className="admin-stat-value" style={{ fontSize: '1.5rem' }}>₹{worker.daily_income_estimate || '—'}</div>
        </div>
      </div>

      <div className="admin-grid-2" style={{ gap: '16px', marginBottom: '20px' }}>
        {/* Profile Info */}
        <div className="admin-card">
          <div className="admin-card-title"><span>👤</span> Profile</div>
          <div className="detail-row"><span className="detail-label">Zone</span><span className="detail-value">{worker.zone || '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Vehicle</span><span className="detail-value">{worker.vehicle_type || '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{worker.phone || '—'}</span></div>
          <div className="detail-row">
            <span className="detail-label">GPS</span>
            <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
              {worker.gps_lat ? `${worker.gps_lat}, ${worker.gps_lon}` : '—'}
            </span>
          </div>
          <div className="detail-row"><span className="detail-label">Joined</span><span className="detail-value">{worker.created_at ? new Date(worker.created_at).toLocaleDateString() : '—'}</span></div>
        </div>

        {/* Policies */}
        <div className="admin-card">
          <div className="admin-card-title"><span>🛡️</span> Policies ({worker.policies?.length || 0})</div>
          {worker.policies?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {worker.policies.map(p => (
                <div key={p.id || p.policy_id} style={{
                  padding: '10px 12px',
                  background: 'var(--admin-bg-3)',
                  borderRadius: '8px',
                  border: '1px solid var(--admin-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-text)' }}>
                      {p.coverage_type || 'Standard'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-3)' }}>
                      ₹{(p.sum_insured || p.premium || 0).toLocaleString()} · {p.coverage_days || 30} days
                    </div>
                  </div>
                  <span className={`admin-badge ${p.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--admin-text-3)', fontSize: '0.82rem', textAlign: 'center', padding: '16px 0' }}>
              No policies found
            </div>
          )}
        </div>
      </div>

      {/* Claims */}
      <div className="admin-card">
        <div className="admin-card-title"><span>🚨</span> Claims History ({worker.claims?.length || 0})</div>
        {worker.claims?.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Cause</th>
                <th>Status</th>
                <th>Payout</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {worker.claims.map(c => (
                <tr key={c.id || c.claim_id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--admin-text-2)' }}>
                    {(c.id || c.claim_id)?.slice(0, 12)}…
                  </td>
                  <td>{c.primary_cause || '—'}</td>
                  <td>
                    <span className={`admin-badge ${
                      c.status === 'approved' ? 'badge-success' :
                      c.status === 'rejected' ? 'badge-danger' :
                      c.status === 'flagged' ? 'badge-fraud' : 'badge-warning'
                    }`}>{c.status}</span>
                  </td>
                  <td style={{ color: 'var(--admin-success)', fontWeight: 600 }}>
                    {c.payout_amount ? `₹${c.payout_amount}` : '—'}
                  </td>
                  <td style={{ color: 'var(--admin-text-2)', fontSize: '0.78rem' }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      onClick={() => navigate(`/admin/claims/${c.id || c.claim_id}`)}
                    >
                      Review →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--admin-text-3)', fontSize: '0.82rem', textAlign: 'center', padding: '24px 0' }}>
            No claims found for this worker
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
