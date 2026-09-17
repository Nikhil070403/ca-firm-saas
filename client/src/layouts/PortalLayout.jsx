import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, FileCheck2, Receipt, FolderOpen,
  BookOpenText, ListChecks, MessageSquare, Sun, Moon, ChevronDown, LogOut, Menu,
} from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../components/shared/Toast';
import IdleLogoutGuard from '../components/shared/IdleLogoutGuard';
import PanelAssistant from '../components/shared/PanelAssistant';
import { useBranding } from '../features/settings/context/BrandingContext';
import './PortalLayout.css';

const NAV = [
  { label: 'Overview', path: '/portal', icon: LayoutDashboard, end: true },
  { label: 'Compliance', path: '/portal/compliance', icon: FileCheck2 },
  { label: 'Invoices', path: '/portal/invoices', icon: Receipt },
  { label: 'Ledger', path: '/portal/ledger', icon: BookOpenText },
  { label: 'Documents', path: '/portal/documents', icon: FolderOpen },
  { label: 'Projects', path: '/portal/tasks', icon: ListChecks },
  { label: 'Messages', path: '/portal/messages', icon: MessageSquare },
];

/**
 * Dedicated, deliberately simple layout for the Client Portal — no service
 * switcher, no quick-create, no team management. A client only ever sees
 * their own data, scoped server-side, across six read-focused pages.
 */
export default function PortalLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const branding = useBranding();
  const toast = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    navigate('/login');
  };

  return (
    <div className="portal-layout">
      <IdleLogoutGuard />
      <aside className={`portal-layout__sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="portal-layout__brand">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="" className="portal-layout__brand-logo" />
          ) : (
            <Building2 size={20} />
          )}
          <span>{branding.name || 'CA Firm SaaS'}</span>
        </div>
        <p className="portal-layout__portal-label">Client Portal</p>
        <nav className="portal-layout__nav">
          {NAV.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) => `portal-layout__link ${isActive ? 'is-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && <div className="portal-layout__scrim" onClick={() => setSidebarOpen(false)} />}

      <div className="portal-layout__main">
        <header className="portal-layout__topbar">
          <button type="button" className="portal-layout__menu-btn" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle menu">
            <Menu size={20} />
          </button>
          <div className="portal-layout__spacer" />
          <button type="button" className="portal-layout__icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <div className="portal-layout__user" ref={menuRef}>
            <button type="button" className="portal-layout__user-trigger" onClick={() => setMenuOpen((v) => !v)}>
              <span className="portal-layout__avatar">{user?.name?.[0]?.toUpperCase() || 'C'}</span>
              <span className="portal-layout__user-name">{user?.name}</span>
              <ChevronDown size={14} />
            </button>
            {menuOpen && (
              <div className="portal-layout__menu">
                <div className="portal-layout__menu-header">
                  <p>{user?.name}</p>
                  <span>{user?.email}</span>
                </div>
                <button type="button" onClick={handleLogout}>
                  <LogOut size={15} /> Log out
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="portal-layout__content">
          <Outlet />
        </main>
      </div>
      <PanelAssistant />
    </div>
  );
}
