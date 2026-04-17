import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetAuditLogs } from '../services/adminApi';

const ACTION_ICONS = {
  review_claim: '🚨',
  update_config: '⚙️',
  create_policy: '🛡️',
  resolve_fraud: '🔎',
  default: '📋',
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminGetAuditLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    !search ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_id?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout pageTitle="🧾 Audit Logs">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Audit Trail</div>
          <div className="admin-page-subtitle">Full history of admin actions — {logs.length} records</div>
        </div>
        <button className="admin-btn admin-btn-ghost" onClick={() => window.location.reload()}>
          🔄 Refresh
        </button>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">Actions Log</div>
          <div className="admin-search">
            <span>🔍</span>
            <input
              placeholder="Search actions, entities…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /><span>Loading audit logs…</span></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🧾</div>
            <div className="admin-empty-text">No audit logs found</div>
            <div className="admin-empty-sub">Actions will appear here as admins interact with the system</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((log, i) => (
              <div key={log.id || i} style={{
                display: 'flex',
                gap: '14px',
                padding: '14px 20px',
                borderBottom: '1px solid var(--admin-border)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--admin-bg-3)',
                  border: '1px solid var(--admin-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  {ACTION_ICONS[log.action] || ACTION_ICONS.default}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '3px' }}>
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--admin-text)',
                      textTransform: 'capitalize',
                    }}>
                      {log.action?.replace(/_/g, ' ') || '—'}
                    </span>
                    <span className="admin-badge badge-info" style={{ fontSize: '0.65rem' }}>
                      {log.entity}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {log.entity_id && (
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--admin-text-3)' }}>
                        {log.entity_id}
                      </span>
                    )}
                    {log.user_id && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-2)' }}>
                        by: {log.user_id.slice(0, 12)}…
                      </span>
                    )}
                  </div>

                  {/* Change data */}
                  {(log.old_data || log.new_data) && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '6px',
                      flexWrap: 'wrap',
                    }}>
                      {log.old_data && Object.keys(log.old_data).length > 0 && (
                        <div style={{
                          padding: '3px 8px',
                          background: 'var(--admin-danger-dim)',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          color: 'var(--admin-danger)',
                          fontFamily: 'monospace',
                        }}>
                          — {JSON.stringify(log.old_data)}
                        </div>
                      )}
                      {log.new_data && Object.keys(log.new_data).length > 0 && (
                        <div style={{
                          padding: '3px 8px',
                          background: 'var(--admin-success-dim)',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          color: 'var(--admin-success)',
                          fontFamily: 'monospace',
                        }}>
                          + {JSON.stringify(log.new_data)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-2)', fontWeight: 500 }}>
                    {log.created_at ? new Date(log.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-3)' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString() : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="admin-table-footer">
            Showing {filtered.length} of {logs.length} log entries
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
