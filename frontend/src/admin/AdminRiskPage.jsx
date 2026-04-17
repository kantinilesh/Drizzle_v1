import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { adminGetZoneRisk } from '../services/adminApi';

export default function AdminRiskPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetZoneRisk();
      setZones(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (level) => {
    if (level === 'HIGH') return 'var(--admin-danger)';
    if (level === 'MEDIUM') return 'var(--admin-warning)';
    return 'var(--admin-success)';
  };

  const getOverall = (z) => {
    if (z.overall) return z.overall;
    const avg = (z.avg_weather + z.avg_traffic + z.avg_social) / 3;
    return avg >= 0.6 ? 'HIGH' : avg >= 0.35 ? 'MEDIUM' : 'LOW';
  };

  const ScoreCell = ({ score, level }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{
        fontSize: '0.72rem',
        fontWeight: 700,
        color: getRiskColor(level || (score >= 0.6 ? 'HIGH' : score >= 0.35 ? 'MEDIUM' : 'LOW')),
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {level || (score >= 0.6 ? 'HIGH' : score >= 0.35 ? 'MEDIUM' : 'LOW')}
      </span>
      <div style={{ height: '4px', background: 'var(--admin-bg-3)', borderRadius: '2px', width: '80px' }}>
        <div style={{
          height: '100%',
          width: `${score * 100}%`,
          borderRadius: '2px',
          background: getRiskColor(score >= 0.6 ? 'HIGH' : score >= 0.35 ? 'MEDIUM' : 'LOW'),
        }} />
      </div>
      <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-3)' }}>{(score * 100).toFixed(0)}%</span>
    </div>
  );

  return (
    <AdminLayout pageTitle="📡 Risk Monitor">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Live Risk Monitor</div>
          <div className="admin-page-subtitle">
            Zone-level risk aggregation · Auto-refreshes every 60s
            {lastRefresh && (
              <span style={{ marginLeft: '8px', color: 'var(--admin-text-3)' }}>
                · Last: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.75rem', color: 'var(--admin-success)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--admin-success)', display: 'inline-block',
              animation: 'pulse3 1.5s ease infinite',
            }} />
            LIVE
          </span>
          <button className="admin-btn admin-btn-ghost" onClick={load} disabled={loading}>
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        {['HIGH', 'MEDIUM', 'LOW'].map(level => {
          const count = zones.filter(z => getOverall(z) === level).length;
          const color = level === 'HIGH' ? 'red' : level === 'MEDIUM' ? 'yellow' : 'green';
          return (
            <div key={level} className={`admin-stat-card ${color}`}>
              <div className="admin-stat-label">{level} Risk Zones</div>
              <div className={`admin-stat-value ${color}`}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Zone Table */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">Zone Risk Breakdown</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-3)' }}>
            Aggregated from MCP weather, traffic, and social signals
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /><span>Loading risk data…</span></div>
        ) : zones.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📡</div>
            <div className="admin-empty-text">No risk data available</div>
            <div className="admin-empty-sub">Make sure MCP servers are running</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>🌧️ Weather</th>
                <th>🚦 Traffic</th>
                <th>📰 Social</th>
                <th>Overall Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {[...zones].sort((a, b) => {
                const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                return order[getOverall(a)] - order[getOverall(b)];
              }).map((z, i) => {
                const overall = getOverall(z);
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{z.zone}</td>
                    <td><ScoreCell score={z.avg_weather} level={z.weather_level} /></td>
                    <td><ScoreCell score={z.avg_traffic} level={z.traffic_level} /></td>
                    <td><ScoreCell score={z.avg_social} level={z.social_level} /></td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        background: `${getRiskColor(overall)}20`,
                        color: getRiskColor(overall),
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        border: `1px solid ${getRiskColor(overall)}44`,
                      }}>
                        {overall}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={() => navigate(`/admin/claims?zone=${z.zone}`)}
                      >
                        View Claims →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '20px',
        padding: '16px 20px',
        background: 'var(--admin-surface)',
        borderRadius: '12px',
        border: '1px solid var(--admin-border)',
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--admin-text-2)', marginBottom: '4px', flex: '100%' }}>
          RISK LEVEL THRESHOLDS
        </div>
        {[
          { label: 'High Risk', range: '≥ 60%', color: 'var(--admin-danger)', desc: 'Immediate attention required' },
          { label: 'Medium Risk', range: '35–59%', color: 'var(--admin-warning)', desc: 'Monitor closely' },
          { label: 'Low Risk', range: '< 35%', color: 'var(--admin-success)', desc: 'Normal operations' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '0.78rem', color: l.color, fontWeight: 700 }}>{l.label}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-3)', marginLeft: '6px' }}>{l.range} · {l.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse3 {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </AdminLayout>
  );
}
