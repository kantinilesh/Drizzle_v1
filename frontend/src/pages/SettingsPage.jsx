import { useNavigate } from 'react-router-dom';
import { User, Lock, LogOut, ChevronRight, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: User, label: 'Profile', desc: 'View & edit your profile', action: () => navigate('/profile-setup') },
    { icon: Lock, label: 'Change Password', desc: 'Update your password', action: () => {} },
  ];

  return (
    <div className="app-container">
      <div className="page">
        <h1 className="page-title">Settings</h1>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* User Card */}
          <div className="glass-card-strong settings-user-card">
            <div className="settings-avatar">
              {user?.full_name?.charAt(0) || 'W'}
            </div>
            <div className="settings-user-info">
              <p className="settings-user-name">{user?.full_name || 'Worker'}</p>
              <p className="settings-user-email">{user?.email || ''}</p>
              <p className="settings-user-zone">{user?.zone || ''}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="glass-card settings-menu" style={{ marginTop: 'var(--space-md)' }}>
            {menuItems.map(({ icon: Icon, label, desc, action }, i) => (
              <div
                key={label}
                className="settings-menu-item"
                onClick={action}
                style={i > 0 ? { borderTop: '1px solid var(--border-light)' } : {}}
                id={`settings-${label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className="settings-menu-icon-wrap">
                  <Icon size={18} />
                </div>
                <div className="settings-menu-content">
                  <span className="settings-menu-label">{label}</span>
                  <span className="settings-menu-desc">{desc}</span>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-dim)' }} />
              </div>
            ))}
          </div>

          {/* Logout */}
          <button
            className="btn btn-full settings-logout"
            onClick={handleLogout}
            id="btn-logout"
          >
            <LogOut size={18} />
            Logout
          </button>

          {/* App Info */}
          <div className="settings-app-info">
            <Droplets size={16} style={{ color: 'var(--primary)' }} />
            <span>Drizzle v1.0.0</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
