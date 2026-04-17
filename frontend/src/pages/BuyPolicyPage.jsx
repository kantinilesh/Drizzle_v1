import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { COVERAGE_TYPES, COVERAGE_DURATIONS, SUM_INSURED_OPTIONS } from '../services/mockData';
import { apiCalculatePremium, apiCreatePolicy } from '../services/api';
import './BuyPolicy.css';

export default function BuyPolicyPage() {
  const [coverageType, setCoverageType] = useState('comprehensive');
  const [duration, setDuration] = useState(30);
  const [sumInsured, setSumInsured] = useState(10000);
  const [premium, setPremium] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    apiCalculatePremium(coverageType, duration, sumInsured)
      .then(res => setPremium(res.premium))
      .finally(() => setLoading(false));
  }, [coverageType, duration, sumInsured]);

  const handleBuy = async () => {
    setBuying(true);
    try {
      await apiCreatePolicy(coverageType, duration, sumInsured);
      setSuccess(true);
      setTimeout(() => navigate('/policies'), 2000);
    } catch {
      alert('Failed to create policy');
    } finally {
      setBuying(false);
    }
  };

  if (success) {
    return (
      <div className="app-container">
        <div className="buy-success">
          <motion.div
            className="buy-success-check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Check size={48} />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Policy Created!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ color: 'var(--text-muted)', marginTop: 8 }}
          >
            Redirecting to your policies...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="page">
        <div className="buy-header">
          <button className="auth-back" onClick={() => navigate(-1)} id="btn-back">
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Buy Policy</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Coverage Type */}
          <div className="form-group">
            <label className="form-label">Coverage Type</label>
            <div className="buy-coverage-grid">
              {COVERAGE_TYPES.map(({ value, label, icon }) => (
                <button
                  key={value}
                  className={`buy-coverage-item ${coverageType === value ? 'buy-coverage-active' : ''}`}
                  onClick={() => setCoverageType(value)}
                  id={`coverage-${value}`}
                >
                  <span className="buy-coverage-icon">{icon}</span>
                  <span className="buy-coverage-label">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="form-group">
            <label className="form-label">Coverage Duration</label>
            <div className="radio-group">
              {COVERAGE_DURATIONS.map(({ value, label }) => (
                <div className="radio-option" key={value}>
                  <input
                    type="radio"
                    name="duration"
                    id={`dur-${value}`}
                    value={value}
                    checked={duration === value}
                    onChange={() => setDuration(value)}
                  />
                  <label htmlFor={`dur-${value}`}>{label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Sum Insured */}
          <div className="form-group">
            <label className="form-label" htmlFor="sum-insured">Sum Insured</label>
            <select
              id="sum-insured"
              className="form-select"
              value={sumInsured}
              onChange={(e) => setSumInsured(Number(e.target.value))}
            >
              {SUM_INSURED_OPTIONS.map(v => (
                <option key={v} value={v}>₹{v.toLocaleString()}</option>
              ))}
            </select>
          </div>

          {/* Premium Display */}
          <div className="buy-premium-card glass-card-strong">
            <span className="buy-premium-label">Estimated Premium</span>
            <div className="buy-premium-amount">
              {loading ? (
                <span className="spinner" style={{ width: 24, height: 24 }} />
              ) : (
                <>₹{premium?.toLocaleString()}</>
              )}
            </div>
          </div>

          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleBuy}
            disabled={buying || loading}
            id="btn-buy-now"
          >
            {buying ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'Buy Now'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
