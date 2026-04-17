import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { adminGetFraudAlerts, adminResolveFraudAlert } from '../services/adminApi';

export default function AdminFraudPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unresolved');
  const [resolving, setResolving] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    const resolved = filter === 'all' ? null : filter === 'resolved' ? true : false;
    adminGetFraudAlerts(resolved)
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleResolve = async (alertId) => {
    setResolving(alertId);
    try {
      await adminResolveFraudAlert(alertId);
      setToast({ text: 'Alert resolved', type: 'success' });
      load();
    } catch (e) {
      setToast({ text: e.message || 'Failed', type: 'error' });
    } finally {
      setResolving(null);
    }
  };

  const getFraudColor = (score) => {
    if (score >= 0.5) return 'var(--admin-danger)';
    if (score >= 0.3) return 'var(--admin-fraud)';
    return 'var(--admin-warning)';
  };

  return (
    <AdminLayout pageTitle="🔎 Fraud Panel">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Fraud Detection Panel</div>
          <div className="admin-page-subtitle">
            {alerts.filter(a => !a.is_resolved).length} unresolved alerts
          </div>
        </div>
        {alerts.filter(a => !a.is_resolved).length > 0 && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: 'var(--admin-danger-dim)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '20px',
            color: 'var(--admin-danger)',
            fontSize: '0.78rem',
            fontWeight: 700,
            animation: 'alertPulse 2s ease infinite',
          }}>
            ⚠️ {alerts.filter(a => !a.is_resolved).length} Active Alerts
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {['unresolved', 'resolved', 'all'].map(f => (
          <button
            key={f}
            className={`admin-btn admin-btn-sm ${filter === f ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize' }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /><span>Loading fraud alerts…</span></div>
      ) : alerts.length === 0 ? (
        <div className="admin-empty" style={{ background: 'var(--admin-surface)', borderRadius: 12, border: '1px solid var(--admin-border)', padding: '60px 20px' }}>
          <div className="admin-empty-icon">🛡️</div>
          <div className="admin-empty-text">No fraud alerts found</div>
          <div className="admin-empty-sub">
            {filter === 'unresolved' ? 'All alerts have been resolved' : 'No alerts in this category'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map(alert => (
            <div key={alert.id} style={{
              background: 'var(--admin-surface)',
              border: `1px solid ${alert.is_resolved ? 'var(--admin-border)' : 'rgba(249, 115, 22, 0.25)'}`,
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.2s ease',
              opacity: alert.is_resolved ? 0.65 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>
                      {alert.is_resolved ? '✅' : '⚠️'}
                    </span>
                    <div>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: 'var(--admin-text-2)',
                        display: 'block',
                        marginBottom: '2px',
                      }}>
                        Claim: {alert.claim_id}
                      </span>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: alert.is_resolved ? 'var(--admin-text-2)' : 'var(--admin-text)',
                      }}>
                        {alert.issue || 'Suspicious activity detected'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Fraud Score */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-2)', fontWeight: 600 }}>Score</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '80px',
                          height: '5px',
                          background: 'var(--admin-bg-3)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${(alert.fraud_score || 0) * 100}%`,
                            background: getFraudColor(alert.fraud_score || 0),
                            borderRadius: '2px',
                          }} />
                        </div>
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: getFraudColor(alert.fraud_score || 0),
                        }}>
                          {((alert.fraud_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <span className={`admin-badge ${
                      (alert.fraud_score || 0) >= 0.5 ? 'badge-danger' :
                      (alert.fraud_score || 0) >= 0.3 ? 'badge-fraud' : 'badge-warning'
                    }`}>
                      {alert.verdict || 'suspicious'}
                    </span>

                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-3)' }}>
                      {alert.created_at ? new Date(alert.created_at).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                    onClick={() => navigate(`/admin/claims/${alert.claim_id}`)}
                  >
                    View Claim →
                  </button>
                  {!alert.is_resolved && (
                    <button
                      className="admin-btn admin-btn-success admin-btn-sm"
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolving === alert.id}
                    >
                      {resolving === alert.id ? '⏳' : '✅'} Resolve
                    </button>
                  )}
                  {alert.is_resolved && (
                    <span style={{
                      fontSize: '0.72rem',
                      color: 'var(--admin-success)',
                      fontWeight: 600,
                      padding: '5px 10px',
                    }}>
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="admin-toast">
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.text}
          <button
            onClick={() => setToast(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--admin-text-2)', cursor: 'pointer', fontSize: '1rem' }}
          >×</button>
        </div>
      )}

      <style>{`
        @keyframes alertPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </AdminLayout>
  );
}
