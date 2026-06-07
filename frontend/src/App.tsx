import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CsvImportPage from './pages/CsvImportPage';
import ReportsPage from './pages/ReportsPage';
import SignalsPage from './pages/SignalsPage';
import RiskRegisterPage from './pages/RiskRegisterPage';
import NotificationsPage from './pages/NotificationsPage';
import AuditTrailPage from './pages/AuditTrailPage';

function PrivateRoutes() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="app-loading">
        <span className="spinner" />
        <p>Loading PV Sentinel…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/import" element={<CsvImportPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/signals" element={<SignalsPage />} />
        <Route path="/risks" element={<RiskRegisterPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/audit" element={<AuditTrailPage />} />
      </Route>
    </Routes>
  );
}

function PublicRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoutes />} />
          <Route path="/*" element={<PrivateRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
