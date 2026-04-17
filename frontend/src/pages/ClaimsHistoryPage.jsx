import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiGetClaims } from '../services/api';
import './Claims.css';

export default function ClaimsHistoryPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiGetClaims().then(setClaims).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="app-container">
        <div className="page">
          <h1 className="page-title">Claims History</h1>
          <div className="loading-screen"><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="page">
        <h1 className="page-title">Claims History</h1>

        {claims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p>No claims yet</p>
            <p style={{ fontSize: '0.85rem', marginTop: 8, color: 'var(--text-dim)' }}>
              Claims are auto-triggered when risk thresholds are met.
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {claims.map((claim) => (
              <motion.div
                key={claim.claim_id}
                className="glass-card claim-card"
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                onClick={() => navigate(`/claims/${claim.claim_id}`)}
                id={`claim-${claim.claim_id}`}
              >
                <div className="claim-card-top">
                  <div className="claim-card-left">
                    <span className="claim-card-icon">{claim.cause_icon}</span>
                    <div>
                      <p className="claim-card-cause">{claim.cause} Claim</p>
                      <p className="claim-card-date">{claim.created_at}</p>
                    </div>
                  </div>
                  <div className="claim-card-right">
                    <span className="claim-card-amount">₹{claim.payout}</span>
                    <span className={`status-badge status-${claim.status}`}>
                      {claim.status}
                    </span>
                  </div>
                </div>
                <div className="claim-card-bottom">
                  <span className="claim-card-confidence">
                    Confidence: <strong>{claim.confidence}</strong>
                  </span>
                  <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
