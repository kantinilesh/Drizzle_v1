import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Locate } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiSaveProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ZONES, VEHICLE_TYPES, INCOME_RANGES } from '../services/mockData';
import './ProfileSetup.css';

export default function ProfileSetupPage() {
  const [vehicleType, setVehicleType] = useState('');
  const [zone, setZone] = useState('');
  const [incomeRange, setIncomeRange] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const handleLocation = () => {
    setLocating(true);
    // Simulate GPS
    setTimeout(() => {
      setLocationText('13.0827° N, 80.2707° E');
      setLocating(false);
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!vehicleType || !zone) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const profile = {
        vehicle_type: vehicleType,
        zone,
        gps_lat: 13.08,
        gps_lon: 80.27,
        daily_income_estimate: parseInt(incomeRange?.match(/\d+/)?.[0] || '1000'),
      };
      const updated = await apiSaveProfile(profile);
      updateUser(updated);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-page">
      <motion.div
        className="profile-setup-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="profile-setup-header">
          <h1 className="page-title">Complete Profile</h1>
          <p className="profile-setup-sub">Set up your worker profile to get started</p>
        </div>

        <form onSubmit={handleSubmit} id="profile-setup-form">
          {error && <div className="auth-error">{error}</div>}

          {/* Vehicle Type */}
          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <div className="radio-group">
              {VEHICLE_TYPES.map(({ value, label }) => (
                <div className="radio-option" key={value}>
                  <input
                    type="radio"
                    name="vehicleType"
                    id={`vehicle-${value}`}
                    value={value}
                    checked={vehicleType === value}
                    onChange={() => setVehicleType(value)}
                  />
                  <label htmlFor={`vehicle-${value}`}>{label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Zone */}
          <div className="form-group">
            <label className="form-label" htmlFor="zone-select">Work Zone</label>
            <select
              id="zone-select"
              className="form-select"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              required
            >
              <option value="">Select your zone</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {/* GPS */}
          <div className="form-group">
            <label className="form-label">GPS Location</label>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={handleLocation}
              disabled={locating}
              id="btn-use-location"
            >
              {locating ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Locating...
                </>
              ) : locationText ? (
                <>
                  <MapPin size={16} />
                  {locationText}
                </>
              ) : (
                <>
                  <Locate size={16} />
                  Use Current Location
                </>
              )}
            </button>
          </div>

          {/* Income Range */}
          <div className="form-group">
            <label className="form-label" htmlFor="income-select">Daily Income Range</label>
            <select
              id="income-select"
              className="form-select"
              value={incomeRange}
              onChange={(e) => setIncomeRange(e.target.value)}
            >
              <option value="">Select range</option>
              {INCOME_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            id="btn-save-profile"
            style={{ marginTop: 'var(--space-md)' }}
          >
            {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'Save & Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
