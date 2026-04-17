import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiGetClaim } from '../services/api';
import './Claims.css';

const riskColors = { HIGH: 'var(--danger)', MEDIUM: 'var(--warning)', LOW: 'var(--success)' };

export default function ClaimDetailPage() {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiGetClaim(id).then(setClaim).catch(() => navigate('/claims')).finally(() => setLoading(false));
  }, [id]);

  if (loading || !claim) {
    return (
      <div className="app-container">
        <div className="page">
          <div className="loading-screen"><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  const getLevel = (score) => score >= 0.6 ? 'HIGH' : score >= 0.3 ? 'MEDIUM' : 'LOW';

  return (
    <div className="app-container">
      <div className="page">
        <div className="buy-header">
          <button className="auth-back" onClick={() => navigate('/claims')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Claim Details</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Status Header */}
          <div className={`glass-card-strong claim-detail-header claim-detail-${claim.status}`}>
            <div className="claim-detail-header-icon">
              {claim.status === 'approved' ? <ShieldCheck size={28} /> : <AlertTriangle size={28} />}
            </div>
            <span className={`status-badge status-${claim.status}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
              {claim.status}
            </span>
            <h2 className="claim-detail-cause">{claim.cause_icon} {claim.cause} Claim</h2>
            <p className="claim-detail-payout">
              {claim.payout > 0 ? `₹${claim.payout}` : 'No payout'}
            </p>
          </div>

          {/* Risk Scores */}
          <div className="glass-card" style={{ marginTop: 'var(--space-md)' }}>
            <div className="section-header">
              <Zap size={14} style={{ color: 'var(--warning)' }} />
              <span className="section-title">Risk Scores at Time of Claim</span>
            </div>
            {[
              { label: 'Weather', emoji: '🌧️', score: claim.weather_score },
              { label: 'Traffic', emoji: '🚦', score: claim.traffic_score },
              { label: 'Social', emoji: '📢', score: claim.social_score },
            ].map(({ label, emoji, score }) => {
              const level = getLevel(score);
              return (
                <div className="claim-detail-score-row" key={label}>
                  <span>{emoji} {label}</span>
                  <div className="claim-detail-score-right">
                    <span style={{ color: riskColors[level], fontWeight: 600 }}>{score.toFixed(2)}</span>
                    <span className={`risk-badge risk-badge-${level.toLowerCase()}`}>{level}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metadata */}
          <div className="glass-card" style={{ marginTop: 'var(--space-md)' }}>
            <div className="section-header">
              <span className="section-title">Claim Info</span>
            </div>
            {[
              { label: 'Claim ID', value: claim.claim_id },
              { label: 'Policy ID', value: claim.policy_id },
              { label: 'Confidence', value: claim.confidence },
              { label: 'Fraud Check', value: claim.fraud_check },
              { label: 'Date', value: claim.created_at },
            ].map(({ label, value }) => (
              <div className="policy-detail-row" key={label} style={{ borderTop: '1px solid var(--border-light)' }}>
                <span className="policy-detail-label">{label}</span>
                <span className="policy-detail-value">{value}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          {claim.description && (
            <div className="glass-card" style={{ marginTop: 'var(--space-md)' }}>
              <div className="section-header">
                <span className="section-title">Description</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {claim.description}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
