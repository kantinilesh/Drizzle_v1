import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.full_name?.split(' ')[0] || 'Worker';

  return (
    <header className="app-header" id="app-header">
      <div className="header-left">
        <div className="header-avatar">
          {firstName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="header-greeting">👋 Hi {firstName}</p>
          <p className="header-zone">{user?.zone || 'Set your zone'}</p>
        </div>
      </div>
      <button
        className="header-bell"
        onClick={() => navigate('/notifications')}
        id="btn-notifications"
        aria-label="Notifications"
      >
        <Bell size={20} />
        <span className="header-bell-dot" />
      </button>
    </header>
  );
}
