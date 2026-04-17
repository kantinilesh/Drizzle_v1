import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiGetRisk } from '../services/api';
import './LiveRisk.css';

const riskColors = { HIGH: '#C45B5B', MEDIUM: '#C49A3C', LOW: '#5B8C6A' };
const riskTrack = { HIGH: 'rgba(196,91,91,0.12)', MEDIUM: 'rgba(196,154,60,0.12)', LOW: 'rgba(91,140,106,0.12)' };

function RiskGauge({ label, emoji, score, level, description }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score);
  const color = riskColors[level];

  return (
    <div className="risk-gauge-card glass-card">
      <div className="risk-gauge-top">
        <span className="risk-gauge-emoji">{emoji}</span>
        <span className="risk-gauge-label">{label}</span>
        <span className={`risk-badge risk-badge-${level.toLowerCase()}`}>{level}</span>
      </div>
      <div className="risk-gauge-visual">
        <svg viewBox="0 0 100 100" className="risk-gauge-svg">
          <circle cx="50" cy="50" r={radius} fill="none" stroke={riskTrack[level]} strokeWidth="8" />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="risk-gauge-center">
          <span className="risk-gauge-score" style={{ color }}>{score.toFixed(2)}</span>
        </div>
      </div>
      <p className="risk-gauge-desc">{description}</p>
    </div>
  );
}

export default function LiveRiskPage() {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchRisk = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await apiGetRisk();
      setRisk(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRisk(); }, [fetchRisk]);

  if (loading || !risk) {
    return (
      <div className="app-container">
        <div className="page">
          <h1 className="page-title">Live Risk</h1>
          <div className="loading-screen"><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  const overallColor = riskColors[risk.overall.level];

  return (
    <div className="app-container">
      <div className="page">
        <div className="live-risk-header">
          <h1 className="page-title" style={{ marginBottom: 0 }}>Live Risk</h1>
          <button
            className="btn btn-secondary"
            onClick={() => fetchRisk(true)}
            disabled={refreshing}
            id="btn-refresh-risk"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {lastUpdated && (
          <p className="live-risk-time">Last updated: {lastUpdated}</p>
        )}

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <RiskGauge label="Weather" emoji="🌧️" score={risk.weather.score} level={risk.weather.level} description={risk.weather.description} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <RiskGauge label="Traffic" emoji="🚦" score={risk.traffic.score} level={risk.traffic.level} description={risk.traffic.description} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
            <RiskGauge label="Social" emoji="📢" score={risk.social.score} level={risk.social.level} description={risk.social.description} />
          </motion.div>
        </motion.div>

        {/* Overall */}
        <motion.div
          className="glass-card-strong live-risk-overall"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="live-risk-overall-label">Overall Risk</span>
          <span className="live-risk-overall-level" style={{ color: overallColor }}>
            {risk.overall.level}
          </span>
          <span className="live-risk-overall-score" style={{ color: overallColor }}>
            {risk.overall.score.toFixed(2)}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
