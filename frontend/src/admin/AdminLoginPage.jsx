import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiLogin } from '../services/api';
import '../admin/admin.css';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      // Backend returns: { user_id, email, phone, role, token, message }
      // Mock returns: { token, user: {...} }
      const role = data.role || data.user?.role;
      if (role !== 'admin') {
        setError('Access denied. This portal is for admins only.');
        localStorage.removeItem('drizzle_token');
        localStorage.removeItem('drizzle_user');
        setLoading(false);
        return;
      }
      // Store user object for AuthContext
      const userData = data.user || {
        id: data.user_id,
        email: data.email,
        phone: data.phone,
        role: data.role,
      };
      localStorage.setItem('drizzle_user', JSON.stringify(userData));
      login(userData);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          <div className="admin-login-logo-icon">🌧️</div>
          <div>
            <div className="admin-login-title">Drizzle Admin</div>
            <div className="admin-login-sub">Operations Control System</div>
          </div>
        </div>

        <div className="admin-login-form-title">Sign In</div>
        <div className="admin-login-form-sub">
          Admin credentials required. Unauthorized access is prohibited.
        </div>

        {error && (
          <div className="admin-error-msg">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">Email Address</label>
            <input
              type="email"
              className="admin-form-input"
              placeholder="admin@drizzle.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              id="admin-email"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Password</label>
            <input
              type="password"
              className="admin-form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              id="admin-password"
            />
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary admin-btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
            id="admin-login-submit"
          >
            {loading ? (
              <><span className="admin-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in…</>
            ) : (
              '🔐 Access Admin Portal'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '14px', background: 'var(--admin-bg-3)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-3)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Dev / Demo
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-2)' }}>
            When using mock mode (no backend), any email/password works if role is "admin".
            Set role in localStorage or connect to real backend.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: 'var(--admin-text-3)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--admin-font)' }}
          >
            ← Back to Worker Portal
          </button>
        </div>
      </div>
    </div>
  );
}
