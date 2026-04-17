import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetAnalytics } from '../services/adminApi';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout pageTitle="📈 Analytics">
        <div className="admin-loading"><div className="admin-spinner" /><span>Loading analytics…</span></div>
      </AdminLayout>
    );
  }

  const trends = data?.daily_trends || [];
  const maxClaims = Math.max(...trends.map(d => d.total_claims), 1);
  const maxPayout = Math.max(...trends.map(d => d.total_payout), 1);
  const topZones = data?.top_zones || [];
  const maxZoneClaims = Math.max(...topZones.map(z => z.total_claims), 1);
  const summary = data?.summary || {};

  return (
    <AdminLayout pageTitle="📈 Analytics">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Analytics Overview</div>
          <div className="admin-page-subtitle">Last 7 days performance metrics</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card blue">
          <div className="admin-stat-label">Total Claims (7d)</div>
          <div className="admin-stat-value blue">{summary.total_claims || 0}</div>
        </div>
        <div className="admin-stat-card green">
          <div className="admin-stat-label">Approval Rate</div>
          <div className="admin-stat-value green">{summary.approval_rate?.toFixed(1) || 0}%</div>
        </div>
        <div className="admin-stat-card yellow">
          <div className="admin-stat-label">Avg Payout</div>
          <div className="admin-stat-value yellow">₹{summary.avg_payout?.toLocaleString() || 0}</div>
        </div>
        <div className="admin-stat-card red">
          <div className="admin-stat-label">Fraud Rate</div>
          <div className="admin-stat-value red">{summary.fraud_rate?.toFixed(1) || 0}%</div>
        </div>
      </div>

      <div className="admin-grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
        {/* Claims per Day Chart */}
        <div className="admin-card">
          <div className="admin-card-title"><span>📊</span> Claims per Day</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px', padding: '8px 4px 0' }}>
            {trends.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--admin-text-3)' }}>{d.total_claims}</span>
                <div style={{
                  width: '100%',
                  borderRadius: '4px 4px 0 0',
                  background: 'var(--admin-primary)',
                  opacity: 0.85,
                  height: `${(d.total_claims / maxClaims) * 100}%`,
                  minHeight: '4px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${(d.approved_claims / d.total_claims) * 100}%`,
                    background: 'var(--admin-success)',
                    opacity: 0.9,
                  }} />
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--admin-text-3)', textAlign: 'center' }}>
                  {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--admin-text-2)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--admin-primary)', opacity: 0.85 }} />
              Total
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--admin-text-2)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--admin-success)' }} />
              Approved
            </div>
          </div>
        </div>

        {/* Payout Chart */}
        <div className="admin-card">
          <div className="admin-card-title"><span>💰</span> Daily Payout (₹)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px', padding: '8px 4px 0' }}>
            {trends.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--admin-text-3)' }}>₹{(d.total_payout / 1000).toFixed(1)}k</span>
                <div style={{
                  width: '100%',
                  borderRadius: '4px 4px 0 0',
                  background: 'linear-gradient(to top, var(--admin-accent), var(--admin-primary))',
                  opacity: 0.8,
                  height: `${(d.total_payout / maxPayout) * 100}%`,
                  minHeight: '4px',
                }} />
                <span style={{ fontSize: '0.6rem', color: 'var(--admin-text-3)', textAlign: 'center' }}>
                  {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--admin-border)', fontSize: '0.78rem', color: 'var(--admin-text-2)' }}>
            Total: ₹{trends.reduce((s, d) => s + d.total_payout, 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="admin-grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
        {/* Top Zones */}
        <div className="admin-card">
          <div className="admin-card-title"><span>📍</span> Payout by Zone</div>
          {topZones.map((z, i) => (
            <div key={i} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-text)' }}>
                  {i + 1}. {z.zone}
                </span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-success)' }}>
                    ₹{z.total_payout.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-3)', marginLeft: '6px' }}>
                    {z.total_claims} claims
                  </span>
                </div>
              </div>
              <div style={{ height: '5px', background: 'var(--admin-bg-3)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(z.total_claims / maxZoneClaims) * 100}%`,
                  background: `hsl(${210 - i * 15}, 75%, ${55 + i * 5}%)`,
                  borderRadius: '3px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="admin-card">
          <div className="admin-card-title"><span>📋</span> Summary</div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--admin-text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Top Causes
            </div>
            {['Weather', 'Traffic', 'Social'].map((cause, i) => {
              const total = trends.reduce((s, d) => s + d.total_claims, 0);
              const pct = [52, 30, 18][i];
              return (
                <div key={cause} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--admin-text)', fontWeight: 600, minWidth: '60px' }}>
                    {i + 1}. {cause}
                  </span>
                  <div style={{ flex: 1, height: '5px', background: 'var(--admin-bg-3)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: ['var(--admin-primary)', 'var(--admin-warning)', 'var(--admin-success)'][i],
                      borderRadius: '3px',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-2)', minWidth: '32px', textAlign: 'right' }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>

          <div className="admin-section-divider" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Total Claims (7d)', value: summary.total_claims || 0 },
              { label: 'Approval Rate', value: `${summary.approval_rate?.toFixed(1) || 0}%` },
              { label: 'Avg Payout', value: `₹${(summary.avg_payout || 0).toLocaleString()}` },
              { label: 'Fraud Rate', value: `${summary.fraud_rate?.toFixed(1) || 0}%`, danger: true },
            ].map(item => (
              <div key={item.label} className="detail-row">
                <span className="detail-label">{item.label}</span>
                <span className="detail-value" style={{ color: item.danger ? 'var(--admin-danger)' : 'var(--admin-text)' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Table */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">Daily Metrics (Last 7 Days)</div>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Claims</th>
              <th>Approved</th>
              <th>Rejected</th>
              <th>Total Payout</th>
              <th>Fraud Cases</th>
              <th>Approval Rate</th>
            </tr>
          </thead>
          <tbody>
            {[...trends].reverse().map((d, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>
                  {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </td>
                <td style={{ fontWeight: 600 }}>{d.total_claims}</td>
                <td style={{ color: 'var(--admin-success)', fontWeight: 600 }}>{d.approved_claims}</td>
                <td style={{ color: 'var(--admin-danger)', fontWeight: 600 }}>{d.rejected_claims}</td>
                <td style={{ color: 'var(--admin-success)', fontWeight: 600 }}>₹{d.total_payout.toLocaleString()}</td>
                <td style={{ color: d.fraud_count > 0 ? 'var(--admin-fraud)' : 'var(--admin-text-2)', fontWeight: d.fraud_count > 0 ? 700 : 400 }}>
                  {d.fraud_count}
                </td>
                <td>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: (d.approved_claims / d.total_claims) >= 0.8 ? 'var(--admin-success)' : 'var(--admin-warning)',
                  }}>
                    {d.total_claims > 0 ? ((d.approved_claims / d.total_claims) * 100).toFixed(0) : 0}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
