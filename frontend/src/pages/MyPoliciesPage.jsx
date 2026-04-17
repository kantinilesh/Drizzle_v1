import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiGetPolicies } from '../services/api';
import './Policies.css';

export default function MyPoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiGetPolicies().then(setPolicies).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="app-container">
        <div className="page">
          <h1 className="page-title">My Policies</h1>
          <div className="loading-screen"><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  const coverageIcons = { comprehensive: '🛡️', weather: '🌧️', traffic: '🚦', social: '📢' };

  return (
    <div className="app-container">
      <div className="page">
        <h1 className="page-title">My Policies</h1>

        {policies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Shield size={48} /></div>
            <p>No policies yet</p>
            <button className="btn btn-primary" onClick={() => navigate('/buy-policy')} style={{ marginTop: 16 }}>
              Buy Your First Policy
            </button>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          >
            {policies.map((policy) => (
              <motion.div
                key={policy.policy_id}
                className="glass-card policy-card"
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                onClick={() => navigate(`/policies/${policy.policy_id}`)}
                id={`policy-${policy.policy_id}`}
              >
                <div className="policy-card-top">
                  <div className="policy-card-left">
                    <span className="policy-card-icon">{coverageIcons[policy.coverage_type] || '🛡️'}</span>
                    <div>
                      <p className="policy-card-type">{policy.coverage_type_label}</p>
                      <p className="policy-card-cover">₹{policy.sum_insured.toLocaleString()} cover</p>
                    </div>
                  </div>
                  <span className={`status-badge status-${policy.status}`}>
                    {policy.status}
                  </span>
                </div>
                <div className="policy-card-bottom">
                  <div className="policy-card-meta">
                    <span>Premium: ₹{policy.premium}</span>
                    <span>•</span>
                    <span>{policy.duration_days} days</span>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-dim)' }} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate('/buy-policy')}
          style={{ marginTop: 'var(--space-lg)' }}
          id="btn-new-policy"
        >
          + New Policy
        </button>
      </div>
    </div>
  );
}
