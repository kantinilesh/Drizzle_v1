import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Calendar, MapPin, CreditCard, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiGetPolicy } from '../services/api';
import './Policies.css';

export default function PolicyDetailPage() {
  const { id } = useParams();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiGetPolicy(id).then(setPolicy).catch(() => navigate('/policies')).finally(() => setLoading(false));
  }, [id]);

  if (loading || !policy) {
    return (
      <div className="app-container">
        <div className="page">
          <div className="loading-screen"><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  const details = [
    { icon: Shield, label: 'Policy ID', value: policy.policy_id },
    { icon: Shield, label: 'Coverage', value: policy.coverage_type_label },
    { icon: MapPin, label: 'Zone', value: policy.zone },
    { icon: CreditCard, label: 'Premium', value: `₹${policy.premium}` },
    { icon: CreditCard, label: 'Sum Insured', value: `₹${policy.sum_insured.toLocaleString()}` },
    { icon: Calendar, label: 'Start Date', value: policy.start_date },
    { icon: Calendar, label: 'End Date', value: policy.end_date },
    { icon: Clock, label: 'Duration', value: `${policy.duration_days} days` },
  ];

  return (
    <div className="app-container">
      <div className="page">
        <div className="buy-header">
          <button className="auth-back" onClick={() => navigate('/policies')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Policy Details</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Status Card */}
          <div className="glass-card-strong policy-detail-status">
            <span className={`status-badge status-${policy.status}`} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              {policy.status}
            </span>
            <h2 className="policy-detail-type">{policy.coverage_type_label}</h2>
            <p className="policy-detail-cover">₹{policy.sum_insured.toLocaleString()} insured</p>
          </div>

          {/* Details */}
          <div className="glass-card" style={{ marginTop: 'var(--space-md)' }}>
            {details.map(({ icon: Icon, label, value }, i) => (
              <div className="policy-detail-row" key={label} style={i > 0 ? { borderTop: '1px solid var(--border-light)' } : {}}>
                <div className="policy-detail-row-left">
                  <Icon size={16} style={{ color: 'var(--text-dim)' }} />
                  <span className="policy-detail-label">{label}</span>
                </div>
                <span className="policy-detail-value">{value}</span>
              </div>
            ))}
          </div>

          {/* Claims Stats */}
          <div className="glass-card" style={{ marginTop: 'var(--space-md)' }}>
            <div className="section-header">
              <span className="section-title">Claims on this Policy</span>
            </div>
            <div className="policy-detail-stats">
              <div className="policy-detail-stat">
                <span className="policy-detail-stat-value">{policy.claims_count}</span>
                <span className="policy-detail-stat-label">Total Claims</span>
              </div>
              <div className="policy-detail-stat">
                <span className="policy-detail-stat-value">₹{policy.total_claimed}</span>
                <span className="policy-detail-stat-label">Total Claimed</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
