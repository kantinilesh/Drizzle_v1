import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Worker pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DashboardPage from './pages/DashboardPage';
import BuyPolicyPage from './pages/BuyPolicyPage';
import MyPoliciesPage from './pages/MyPoliciesPage';
import PolicyDetailPage from './pages/PolicyDetailPage';
import LiveRiskPage from './pages/LiveRiskPage';
import ClaimsHistoryPage from './pages/ClaimsHistoryPage';
import ClaimDetailPage from './pages/ClaimDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import Navbar from './components/Navbar';
import Header from './components/Header';

// Admin pages
import AdminLoginPage from './admin/AdminLoginPage';
import AdminDashboardPage from './admin/AdminDashboardPage';
import { AdminWorkersPage, AdminWorkerDetailPage } from './admin/AdminWorkersPage';
import AdminPoliciesPage from './admin/AdminPoliciesPage';
import { AdminClaimsPage, AdminClaimDetailPage } from './admin/AdminClaimsPage';
import AdminRiskPage from './admin/AdminRiskPage';
import AdminFraudPage from './admin/AdminFraudPage';
import AdminAnalyticsPage from './admin/AdminAnalyticsPage';
import AdminSettingsPage from './admin/AdminSettingsPage';
import AdminAuditPage from './admin/AdminAuditPage';

import './App.css';
import './admin/admin.css';

// ─────────────────────────────────────────────────────────────────
// ROUTE GUARDS
// ─────────────────────────────────────────────────────────────────

/** Requires any authenticated user */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Requires admin role */
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading Drizzle…</p>
    </div>
  );
}

// Layout with header + navbar for worker pages
function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-main">{children}</main>
      <Navbar />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* ── Auth (public) ───────────────────────────────────── */}
      <Route
        path="/login"
        element={
          user
            ? user.role === 'admin'
              ? <Navigate to="/admin/dashboard" replace />
              : <Navigate to="/dashboard" replace />
            : <LoginPage />
        }
      />
      <Route
        path="/signup"
        element={
          user
            ? user.role === 'admin'
              ? <Navigate to="/admin/dashboard" replace />
              : <Navigate to="/dashboard" replace />
            : <SignupPage />
        }
      />

      {/* ── Admin Auth (public) ─────────────────────────────── */}
      <Route
        path="/admin/login"
        element={
          user?.role === 'admin'
            ? <Navigate to="/admin/dashboard" replace />
            : <AdminLoginPage />
        }
      />

      {/* ── Worker routes (requires auth, non-admin) ────────── */}
      <Route path="/profile-setup" element={
        <ProtectedRoute><ProfileSetupPage /></ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><DashboardPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/buy-policy" element={
        <ProtectedRoute>
          <AppLayout><BuyPolicyPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/policies" element={
        <ProtectedRoute>
          <AppLayout><MyPoliciesPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/policies/:id" element={
        <ProtectedRoute>
          <AppLayout><PolicyDetailPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/risk" element={
        <ProtectedRoute>
          <AppLayout><LiveRiskPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/claims" element={
        <ProtectedRoute>
          <AppLayout><ClaimsHistoryPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/claims/:id" element={
        <ProtectedRoute>
          <AppLayout><ClaimDetailPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute>
          <AppLayout><NotificationsPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout><SettingsPage /></AppLayout>
        </ProtectedRoute>
      } />

      {/* ── Admin routes (requires admin role) ─────────────── */}
      <Route path="/admin/dashboard" element={
        <AdminRoute><AdminDashboardPage /></AdminRoute>
      } />

      <Route path="/admin/workers" element={
        <AdminRoute><AdminWorkersPage /></AdminRoute>
      } />

      <Route path="/admin/workers/:id" element={
        <AdminRoute><AdminWorkerDetailPage /></AdminRoute>
      } />

      <Route path="/admin/policies" element={
        <AdminRoute><AdminPoliciesPage /></AdminRoute>
      } />

      <Route path="/admin/claims" element={
        <AdminRoute><AdminClaimsPage /></AdminRoute>
      } />

      <Route path="/admin/claims/:id" element={
        <AdminRoute><AdminClaimDetailPage /></AdminRoute>
      } />

      <Route path="/admin/risk" element={
        <AdminRoute><AdminRiskPage /></AdminRoute>
      } />

      <Route path="/admin/fraud" element={
        <AdminRoute><AdminFraudPage /></AdminRoute>
      } />

      <Route path="/admin/analytics" element={
        <AdminRoute><AdminAnalyticsPage /></AdminRoute>
      } />

      <Route path="/admin/settings" element={
        <AdminRoute><AdminSettingsPage /></AdminRoute>
      } />

      <Route path="/admin/audit" element={
        <AdminRoute><AdminAuditPage /></AdminRoute>
      } />

      {/* ── Catch-all ───────────────────────────────────────── */}
      <Route
        path="*"
        element={
          user?.role === 'admin'
            ? <Navigate to="/admin/dashboard" replace />
            : <Navigate to={user ? '/dashboard' : '/login'} replace />
        }
      />
    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
