import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, FileText, ShoppingBag, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { apiGetRisk, apiGetPolicies, apiGetClaims } from '../services/api';
import './Dashboard.css';

const riskColors = { HIGH: 'var(--danger)', MEDIUM: 'var(--warning)', LOW: 'var(--success)' };
const riskBg = { HIGH: 'var(--danger-bg)', MEDIUM: 'var(--warning-bg)', LOW: 'var(--success-bg)' };

export default function DashboardPage() {
  const [risk, setRisk] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([apiGetRisk(), apiGetPolicies(), apiGetClaims()])
      .then(([r, policies, claims]) => {
        setRisk(r);
        setActivePolicy(policies.find(p => p.status === 'active') || null);
        setRecentClaims(claims.slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)' }}>Loading dashboard...</span>
      </div>
    );
  }

  const quickActions = [
    { icon: ShoppingBag, label: 'Buy Policy', to: '/buy-policy', color: 'var(--primary)' },
    { icon: Eye, label: 'View Policies', to: '/policies', color: 'var(--accent)' },
    { icon: FileText, label: 'Claims History', to: '/claims', color: 'var(--warning)' },
    { icon: TrendingUp, label: 'Live Risk', to: '/risk', color: 'var(--success)' },
  ];

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div
      className="page"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
        {/* Risk Overview */}
        {risk && (
          <motion.div className="glass-card dash-risk-card" variants={cardVariants}>
            <div className="section-header">
              <Zap size={14} style={{ color: 'var(--warning)' }} />
              <span className="section-title">Today's Risk</span>
            </div>

            <div className="dash-risk-items">
              {[
                { label: 'Weather', data: risk.weather, emoji: '🌧️' },
                { label: 'Traffic', data: risk.traffic, emoji: '🚦' },
                { label: 'Social', data: risk.social, emoji: '📢' },
              ].map(({ label, data, emoji }) => (
                <div className="dash-risk-item" key={label}>
                  <span className="dash-risk-emoji">{emoji}</span>
                  <div className="dash-risk-info">
                    <span className="dash-risk-label">{label}</span>
                    <span className="dash-risk-score" style={{ color: riskColors[data.level] }}>
                      {data.score.toFixed(2)}
                    </span>
                  </div>
                  <span
                    className={`risk-badge risk-badge-${data.level.toLowerCase()}`}
                  >
                    {data.level}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="dash-overall-risk"
              style={{ background: riskBg[risk.overall.level], borderColor: riskColors[risk.overall.level] }}
            >
              <span>Overall Risk</span>
              <span className="dash-overall-level" style={{ color: riskColors[risk.overall.level] }}>
                {risk.overall.level}
              </span>
            </div>
          </motion.div>
        )}

        {/* Active Policy */}
        {activePolicy && (
          <motion.div
            className="glass-card dash-policy-card"
            variants={cardVariants}
            onClick={() => navigate(`/policies/${activePolicy.policy_id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="section-header">
              <Shield size={14} style={{ color: 'var(--primary)' }} />
              <span className="section-title">Active Policy</span>
            </div>
            <div className="dash-policy-row">
              <div>
                <p className="dash-policy-type">{activePolicy.coverage_type_label}</p>
                <p className="dash-policy-cover">₹{activePolicy.sum_insured.toLocaleString()} cover</p>
              </div>
              <div className="dash-policy-valid">
                <span className="status-badge status-active">Active</span>
                <p className="dash-policy-date">
                  till {new Date(activePolicy.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div className="dash-actions" variants={cardVariants}>
          <div className="section-header">
            <span className="section-title">Quick Actions</span>
          </div>
          <div className="dash-actions-grid">
            {quickActions.map(({ icon: Icon, label, to, color }) => (
              <button
                key={to}
                className="dash-action-btn"
                onClick={() => navigate(to)}
                id={`action-${label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className="dash-action-icon" style={{ background: `${color}15`, color }}>
                  <Icon size={20} />
                </div>
                <span className="dash-action-label">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        {recentClaims.length > 0 && (
          <motion.div className="glass-card" variants={cardVariants}>
            <div className="section-header">
              <span className="section-title">Recent Activity</span>
            </div>
            {recentClaims.map((claim, i) => (
              <div
                key={claim.claim_id}
                className="dash-activity-item"
                onClick={() => navigate(`/claims/${claim.claim_id}`)}
                style={{ cursor: 'pointer' }}
              >
                <span className="dash-activity-icon">{claim.cause_icon}</span>
                <div className="dash-activity-info">
                  <span className="dash-activity-amount">
                    ₹{claim.payout}
                  </span>
                  <span className="dash-activity-desc">
                    {claim.cause} Claim
                  </span>
                </div>
                <div className="dash-activity-right">
                  <span className={`status-badge status-${claim.status}`}>
                    {claim.status}
                  </span>
                  <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
  );
}
