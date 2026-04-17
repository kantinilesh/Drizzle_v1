import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Droplets, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      const user = res.user || JSON.parse(localStorage.getItem('drizzle_user') || 'null');
      if (!user) throw new Error('Login succeeded, but user profile could not be loaded');
      login(user);
      navigate(user.profile_completed ? '/dashboard' : '/profile-setup');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="auth-logo" id="drizzle-logo">
          <div className="auth-logo-icon">
            <Droplets size={32} />
          </div>
          <h1 className="auth-logo-text">Drizzle</h1>
          <p className="auth-logo-sub">Micro-insurance for gig workers</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" id="login-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email / Phone</label>
            <div className="input-icon-wrap">
              <Mail size={18} className="input-icon" />
              <input
                id="login-email"
                type="email"
                className="form-input input-with-icon"
                placeholder="rahul@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={18} className="input-icon" />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="form-input input-with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span className="auth-remember">Remember me</span>
            </label>
            <a href="#" className="auth-forgot">Forgot Password?</a>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            id="btn-login"
          >
            {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'Login'}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button type="button" className="btn btn-secondary btn-full" id="btn-google">
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              width="18"
              height="18"
            />
            Continue with Google
          </button>
        </form>

        <p className="auth-footer">
          New user? <Link to="/signup" id="link-signup">Sign Up</Link>
        </p>
      </motion.div>
    </div>
  );
}
