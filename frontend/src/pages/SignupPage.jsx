import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiSignup } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function SignupPage() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await apiSignup(form.fullName, form.email, form.phone, form.password);
      // Login immediately after signup
      const userStr = localStorage.getItem('drizzle_user');
      if (userStr) login(JSON.parse(userStr));
      navigate('/profile-setup');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'fullName', label: 'Full Name', type: 'text', icon: User, placeholder: 'Rahul Kumar' },
    { key: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'rahul@test.com' },
    { key: 'phone', label: 'Phone Number', type: 'tel', icon: Phone, placeholder: '9876543210' },
    { key: 'password', label: 'Password', type: showPass ? 'text' : 'password', icon: Lock, placeholder: '••••••••' },
    { key: 'confirmPassword', label: 'Confirm Password', type: showPass ? 'text' : 'password', icon: Lock, placeholder: '••••••••' },
  ];

  return (
    <div className="auth-page">
      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button className="auth-back" onClick={() => navigate('/')} id="btn-back-login">
          <ArrowLeft size={20} />
        </button>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Drizzle to protect your earnings</p>

        <form onSubmit={handleSubmit} className="auth-form" id="signup-form">
          {error && <div className="auth-error">{error}</div>}

          {fields.map(({ key, label, type, icon: Icon, placeholder }) => (
            <div className="form-group" key={key}>
              <label className="form-label" htmlFor={`signup-${key}`}>{label}</label>
              <div className="input-icon-wrap">
                <Icon size={18} className="input-icon" />
                <input
                  id={`signup-${key}`}
                  type={type}
                  className="form-input input-with-icon"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={update(key)}
                  required
                />
                {key === 'password' && (
                  <button type="button" className="input-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            id="btn-create-account"
          >
            {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/" id="link-login">Log In</Link>
        </p>
      </motion.div>
    </div>
  );
}
