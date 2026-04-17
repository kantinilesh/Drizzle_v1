import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/admin/workers', icon: '👷', label: 'Workers' },
  { path: '/admin/policies', icon: '🛡️', label: 'Policies' },
  { path: '/admin/claims', icon: '🚨', label: 'Claims', badge: null },
  { path: '/admin/risk', icon: '📡', label: 'Risk Monitor' },
  { path: '/admin/fraud', icon: '🔎', label: 'Fraud Panel', badge: 'fraud' },
  { path: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
  { path: '/admin/audit', icon: '🧾', label: 'Audit Logs' },
];

export default function AdminLayout({ children, pageTitle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <div className="admin-root">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <div className="sidebar-logo-icon">🌧️</div>
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-title">Drizzle</span>
              <span className="sidebar-logo-sub">Admin Portal</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Operations</span>
          {NAV_ITEMS.slice(0, 5).map(item => (
            <button
              key={item.path}
              className={`sidebar-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
              {item.badge === 'fraud' && (
                <span className="sidebar-badge">!</span>
              )}
            </button>
          ))}

          <span className="sidebar-section-label" style={{ marginTop: '8px' }}>Management</span>
          {NAV_ITEMS.slice(5).map(item => (
            <button
              key={item.path}
              className={`sidebar-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            className="admin-user-card"
            onClick={() => setShowUserMenu(m => !m)}
          >
            <div className="admin-user-avatar">{initials}</div>
            <div className="admin-user-info">
              <div className="admin-user-name">{user?.full_name || 'Admin'}</div>
              <div className="admin-user-role">Admin</div>
            </div>
            <span style={{ color: 'var(--admin-text-3)', fontSize: '0.75rem' }}>▼</span>
          </div>
          {showUserMenu && (
            <div style={{
              marginTop: '8px',
              background: 'var(--admin-bg-3)',
              borderRadius: '8px',
              border: '1px solid var(--admin-border)',
              overflow: 'hidden',
            }}>
              <button
                className="sidebar-link"
                style={{ width: '100%', borderRadius: 0 }}
                onClick={() => { navigate('/dashboard'); }}
              >
                <span>👷</span> Worker View
              </button>
              <button
                className="sidebar-link"
                style={{ width: '100%', borderRadius: 0, color: 'var(--admin-danger)' }}
                onClick={handleLogout}
              >
                <span>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-title">
            {pageTitle}
          </div>
          <div className="admin-topbar-actions">
            <button
              className="admin-topbar-btn"
              onClick={() => navigate('/admin/dashboard')}
            >
              🏠 Dashboard
            </button>
            <button
              className="admin-topbar-btn"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        <div className="admin-content admin-page-anim">
          {children}
        </div>
      </main>
    </div>
  );
}
