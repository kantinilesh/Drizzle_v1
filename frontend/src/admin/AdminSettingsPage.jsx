import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { adminGetConfig, adminUpdateConfig } from '../services/adminApi';

export default function AdminSettingsPage() {
  const [config, setConfig] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    adminGetConfig()
      .then(data => {
        setConfig(data);
        const initial = {};
        data.forEach(c => { initial[c.key] = c.value; });
        setEdits(initial);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const configs = Object.entries(edits).map(([key, value]) => ({ key, value }));
      await adminUpdateConfig(configs);
      setToast({ text: 'Settings saved successfully', type: 'success' });
    } catch (e) {
      setToast({ text: e.message || 'Save failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const setValue = (key, value) => {
    setEdits(e => ({ ...e, [key]: value }));
  };

  const FIELD_META = {
    claim_threshold: {
      label: 'Claim Trigger Threshold',
      desc: 'Minimum fused risk score to auto-approve a claim (0–1)',
      type: 'range',
      min: 0.1,
      max: 0.9,
      step: 0.05,
    },
    fraud_threshold: {
      label: 'Fraud Flag Threshold',
      desc: 'Fraud score above which a claim is flagged for review (0–1)',
      type: 'range',
      min: 0.1,
      max: 0.9,
      step: 0.05,
    },
    fraud_sensitivity: {
      label: 'Fraud Sensitivity',
      desc: 'Sensitivity level for the fraud detection engine',
      type: 'select',
      options: ['low', 'medium', 'high'],
    },
    weather_mcp_url: {
      label: 'Weather MCP Server URL',
      desc: 'Endpoint for the weather risk signal server',
      type: 'url',
    },
    traffic_mcp_url: {
      label: 'Traffic MCP Server URL',
      desc: 'Endpoint for the traffic risk signal server',
      type: 'url',
    },
    social_mcp_url: {
      label: 'Social MCP Server URL',
      desc: 'Endpoint for the social risk signal server',
      type: 'url',
    },
  };

  const grouped = [
    {
      title: '⚙️ Risk Thresholds',
      keys: ['claim_threshold', 'fraud_threshold'],
    },
    {
      title: '🛡️ Fraud Detection',
      keys: ['fraud_sensitivity'],
    },
    {
      title: '📡 MCP Server Config',
      keys: ['weather_mcp_url', 'traffic_mcp_url', 'social_mcp_url'],
    },
  ];

  return (
    <AdminLayout pageTitle="⚙️ Settings">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">System Configuration</div>
          <div className="admin-page-subtitle">Control risk thresholds, fraud sensitivity, and MCP server URLs</div>
        </div>
        <button
          className="admin-btn admin-btn-primary admin-btn-lg"
          onClick={handleSave}
          disabled={saving || loading}
          id="save-settings-btn"
        >
          {saving ? '⏳ Saving…' : '💾 Save Changes'}
        </button>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /><span>Loading config…</span></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {grouped.map(group => (
            <div key={group.title} className="admin-card">
              <div className="admin-card-title"><span>{group.title.split(' ')[0]}</span>{group.title.slice(2)}</div>

              {group.keys.filter(k => FIELD_META[k] || edits[k] !== undefined).map(key => {
                const meta = FIELD_META[key] || { label: key, desc: '', type: 'text' };
                const value = edits[key] ?? '';

                return (
                  <div key={key} style={{
                    padding: '16px 0',
                    borderBottom: '1px solid var(--admin-border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: '3px' }}>
                          {meta.label}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-2)' }}>{meta.desc}</div>
                      </div>

                      <div style={{ minWidth: '260px' }}>
                        {meta.type === 'range' && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-3)' }}>{meta.min}</span>
                              <span style={{
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                color: 'var(--admin-primary)',
                              }}>
                                {parseFloat(value).toFixed(2)}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-3)' }}>{meta.max}</span>
                            </div>
                            <input
                              type="range"
                              min={meta.min}
                              max={meta.max}
                              step={meta.step}
                              value={value}
                              onChange={e => setValue(key, e.target.value)}
                              style={{
                                width: '100%',
                                accentColor: 'var(--admin-primary)',
                                cursor: 'pointer',
                              }}
                            />
                          </div>
                        )}

                        {meta.type === 'select' && (
                          <select
                            className="admin-form-select"
                            value={value}
                            onChange={e => setValue(key, e.target.value)}
                          >
                            {meta.options.map(opt => (
                              <option key={opt} value={opt} style={{ textTransform: 'capitalize' }}>
                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                              </option>
                            ))}
                          </select>
                        )}

                        {(meta.type === 'text' || meta.type === 'url') && (
                          <input
                            type="text"
                            className="admin-form-input"
                            value={value}
                            onChange={e => setValue(key, e.target.value)}
                            placeholder={meta.type === 'url' ? 'http://…' : ''}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Config that doesn't have meta */}
          {config.filter(c => !Object.keys(FIELD_META).includes(c.key)).length > 0 && (
            <div className="admin-card">
              <div className="admin-card-title"><span>🔧</span> Other Config</div>
              {config.filter(c => !Object.keys(FIELD_META).includes(c.key)).map(c => (
                <div key={c.key} style={{ padding: '12px 0', borderBottom: '1px solid var(--admin-border)' }}>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-form-label">{c.key}</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={edits[c.key] || ''}
                      onChange={e => setValue(c.key, e.target.value)}
                    />
                    {c.updated_at && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-3)', marginTop: '4px' }}>
                        Last updated: {new Date(c.updated_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => {
                const initial = {};
                config.forEach(c => { initial[c.key] = c.value; });
                setEdits(initial);
              }}
            >
              🔄 Reset Changes
            </button>
            <button
              className="admin-btn admin-btn-primary admin-btn-lg"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '⏳ Saving…' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="admin-toast" style={{
          borderColor: toast.type === 'success' ? 'var(--admin-success)' : 'var(--admin-danger)',
        }}>
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
