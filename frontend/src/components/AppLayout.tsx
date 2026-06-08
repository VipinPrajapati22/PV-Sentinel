import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, LayoutDashboard, UploadCloud, FlaskConical,
  LineChart, ListChecks, Database, Bell, Download, Search,
  LogOut, Lock, Menu, X,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notifications as notifApi, exports_ } from '../lib/api';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/import', icon: UploadCloud, label: 'CSV Import' },
  { to: '/reports', icon: FlaskConical, label: 'ADR Reports' },
  { to: '/signals', icon: LineChart, label: 'Signal Detection' },
  { to: '/risks', icon: ListChecks, label: 'Risk Register' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/audit', icon: Database, label: 'Audit Trail' },
  { to: '/about', icon: User, label: 'About Us' },
];


export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notifApi.list(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const unreadCount = notifData?.notifications?.filter((n: any) => !n.isRead).length || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exports_.excel();
    } catch (err) {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/signals?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand-lockup">
          <span className="brand-mark"><ShieldCheck size={22} /></span>
          <div>
            <strong>PV Sentinel</strong>
            <span>Drug safety intelligence</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="notif-badge">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="role-card">
          <Lock size={16} />
          <div>
            <strong>{user?.firstName} {user?.lastName}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
      </aside>

      {/* Main workspace */}
      <section className="workspace">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn-icon mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <p className="eyebrow">Pharmacovigilance Platform</p>
              <h1 className="page-title">AI-Powered Drug Safety Intelligence</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <form onSubmit={handleSearch} className="search-box">
              <Search size={16} />
              <input
                placeholder="Search drug, reaction, signal…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <NavLink to="/notifications" className="icon-button" aria-label="Notifications">
              <Bell size={17} />
              {unreadCount > 0 && <span className="notif-dot" />}
            </NavLink>
            <button
              className="btn-primary"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download size={16} />
              {exporting ? 'Exporting…' : 'Export'}
            </button>
            <button className="btn-secondary icon-btn" onClick={handleLogout} title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
