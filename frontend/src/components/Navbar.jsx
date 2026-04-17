import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Shield, Activity, FileText, Settings } from 'lucide-react';
import './Navbar.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/policies', icon: Shield, label: 'Policies' },
  { to: '/risk', icon: Activity, label: 'Risk' },
  { to: '/claims', icon: FileText, label: 'Claims' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Navbar() {
  return (
    <nav className="navbar" id="main-navbar">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `navbar-item ${isActive ? 'navbar-item-active' : ''}`}
          id={`nav-${label.toLowerCase()}`}
        >
          <Icon size={20} strokeWidth={1.8} />
          <span className="navbar-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
