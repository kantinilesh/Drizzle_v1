import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { adminGetDashboard, adminGetZoneRisk } from '../services/adminApi';

function ActivityDot({ type }) {
  const map = {
    claim_triggered: 'green',
    claim_pending: 'yellow',
    claim_approved: 'green',
    policy_created: 'blue',
    fraud_flagged: 'orange',
  };
  return <span className={`activity-dot ${map[type] || 'blue'}`} />;
}

function StatCard({ label, value, color = '', icon, sub }) {
  return (
    <div className={`admin-stat-card ${color}`}>
      <div className="admin-stat-label">{label}</div>
      <div className={`admin-stat-value ${color}`}>{value}</div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
      {icon && <div className="admin-stat-icon">{icon}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [zoneRisk, setZoneRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, risk] = await Promise.all([
          adminGetDashboard(),
          adminGetZoneRisk(),
        ]);
        setData(dash);
        setZoneRisk(risk);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getRiskColor = (level) => {
    if (level === 'HIGH') return 'var(--admin-danger)';
    if (level === 'MEDIUM') return 'var(--admin-warning)';
    return 'var(--admin-success)';
  };

  if (loading) {
    return (
      <AdminLayout pageTitle="📊 Dashboard">
        <div className="admin-loading">
          <div className="admin-spinner" />
          <span>Loading dashboard…</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="📊 Dashboard">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Control Tower</div>
          <div className="admin-page-subtitle">
            Real-time platform overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => window.location.reload()}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <StatCard label="Total Workers" value={data?.total_workers?.toLocaleString()} color="blue" icon="👷" sub="Registered gig workers" />
        <StatCard label="Active Policies" value={data?.active_policies?.toLocaleString()} color="green" icon="🛡️" sub="Currently active" />
        <StatCard label="Claims Today" value={data?.claims_today?.toLocaleString()} color="yellow" icon="🚨" sub="Since midnight" />
        <StatCard label="Payout Today" value={`₹${data?.total_payout_today?.toLocaleString()}`} color="purple" icon="💰" sub="Total disbursed" />
        <StatCard label="Fraud Alerts" value={data?.fraud_alerts_count} color="red" icon="🔎" sub="Unresolved alerts" />
      </div>

      <div className="admin-grid-2" style={{ gap: '20px' }}>
        {/* Live Activity */}
        <div className="admin-card">
          <div className="admin-card-title">
            <span className="admin-card-title-icon">⚡</span>
            Live Activity
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--admin-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--admin-success)', display: 'inline-block', animation: 'pulse2 1.5s ease infinite' }} />
              LIVE
            </span>
          </div>
          <div className="activity-feed">
            {data?.recent_activity?.length > 0 ? data.recent_activity.map((item, i) => (
              <div key={i} className="activity-item">
                <ActivityDot type={item.type} />
                <div className="activity-text">
                  <strong style={{ color: 'var(--admin-text)' }}>{item.worker}</strong>
                  {' '}→{' '}
                  {item.type === 'claim_triggered' && `Claim triggered — ₹${item.amount}`}
                  {item.type === 'claim_pending' && `Claim pending ${item.note ? `(${item.note})` : ''}`}
                  {item.type === 'claim_approved' && `Claim approved — ₹${item.amount}`}
                  {item.type === 'policy_created' && `New policy — ₹${item.amount} premium`}
                  {item.type === 'fraud_flagged' && `Fraud alert — ${item.note}`}
                </div>
                <span className="activity-time">{item.time}</span>
              </div>
            )) : (
              <div className="admin-empty" style={{ padding: '24px 0' }}>
                <div style={{ color: 'var(--admin-text-3)', fontSize: '0.85rem' }}>No recent activity</div>
              </div>
            )}
          </div>
          <button
            className="admin-btn admin-btn-ghost"
            style={{ width: '100%', marginTop: '12px', fontSize: '0.78rem' }}
            onClick={() => navigate('/admin/claims')}
          >
            View All Claims →
          </button>
        </div>

        {/* Zone Risk Overview */}
        <div className="admin-card">
          <div className="admin-card-title">
            <span className="admin-card-title-icon">📡</span>
            Zone Risk Overview
          </div>
          {zoneRisk.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {zoneRisk.map((z, i) => {
                const overall = z.overall || (
                  ((z.avg_weather + z.avg_traffic + z.avg_social) / 3) >= 0.6 ? 'HIGH' :
                  ((z.avg_weather + z.avg_traffic + z.avg_social) / 3) >= 0.35 ? 'MEDIUM' : 'LOW'
                );
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--admin-bg-3)',
                    borderRadius: '8px',
                    border: '1px solid var(--admin-border)',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text)' }}>{z.zone}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-3)', marginTop: '2px' }}>
                        W:{(z.avg_weather * 100).toFixed(0)}% · T:{(z.avg_traffic * 100).toFixed(0)}% · S:{(z.avg_social * 100).toFixed(0)}%
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '20px',
                      background: `${getRiskColor(overall)}22`,
                      color: getRiskColor(overall),
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {overall}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty" style={{ padding: '24px 0' }}>
              <div style={{ color: 'var(--admin-text-3)', fontSize: '0.85rem' }}>No zone data available</div>
            </div>
          )}
          <button
            className="admin-btn admin-btn-ghost"
            style={{ width: '100%', marginTop: '12px', fontSize: '0.78rem' }}
            onClick={() => navigate('/admin/risk')}
          >
            Full Risk Monitor →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-card" style={{ marginTop: '20px' }}>
        <div className="admin-card-title">
          <span>⚡</span> Quick Actions
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/claims')}>
            🚨 Review Pending Claims
          </button>
          <button className="admin-btn admin-btn-ghost" onClick={() => navigate('/admin/fraud')}>
            🔎 Fraud Alerts ({data?.fraud_alerts_count || 0})
          </button>
          <button className="admin-btn admin-btn-ghost" onClick={() => navigate('/admin/policies')}>
            ➕ Create Policy
          </button>
          <button className="admin-btn admin-btn-ghost" onClick={() => navigate('/admin/analytics')}>
            📈 View Analytics
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse2 {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </AdminLayout>
  );
}
