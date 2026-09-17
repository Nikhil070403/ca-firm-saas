import { useState, useRef, useEffect } from 'react';
import {
  Menu, Sun, Moon, ChevronDown, LogOut, User as UserIcon,
  LayoutGrid, Search, Plus, Contact, Users, ListChecks, Receipt, BellRing,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../shared/Toast';
import { servicesForUser, serviceForPath, canAccessService } from '../../constants/services';
import NotificationBell from '../shared/NotificationBell';
import GlobalSearch from '../shared/GlobalSearch';
import './Topbar.css';

function useClickOutside(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
}

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const menuRef = useClickOutside(() => setMenuOpen(false));
  const switcherRef = useClickOutside(() => setSwitcherOpen(false));
  const createRef = useClickOutside(() => setCreateOpen(false));

  const services = servicesForUser(user);
  const activeService = serviceForPath(location.pathname);

  const quickCreateItems = [
    { label: 'New Lead', icon: Contact, path: '/crm/leads/status/all?create=1', service: 'crm' },
    { label: 'New Client', icon: Users, path: '/crm/clients?create=1', service: 'crm' },
    { label: 'New Task', icon: ListChecks, path: '/crm/tasks?create=1', service: 'crm' },
    { label: 'New Reminder', icon: BellRing, path: '/crm/reminders?create=1', service: 'crm' },
    { label: 'New Invoice', icon: Receipt, path: '/accounts/invoices?create=1', service: 'accounts' },
  ].filter((item) => canAccessService(user, item.service));

  const todayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short',
  }).format(new Date());

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    navigate('/login');
  };

  return (
    <header className="topbar">
      <button type="button" className="topbar__menu-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      <button type="button" className="topbar__search" onClick={() => setSearchOpen(true)}>
        <Search size={15} />
        <span>Search clients, leads, invoices…</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div className="topbar__spacer" />

      <span className="topbar__date">{todayLabel}</span>

      <div className="topbar__switcher" ref={createRef}>
        <button
          type="button"
          className="topbar__create-btn"
          onClick={() => setCreateOpen((v) => !v)}
          aria-label="Quick create"
          title="Quick create"
        >
          <Plus size={17} />
        </button>
        {createOpen && (
          <div className="topbar__switcher-menu">
            <p className="topbar__switcher-title">Quick Create</p>
            {quickCreateItems.map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                type="button"
                className="topbar__switcher-item"
                onClick={() => { setCreateOpen(false); navigate(path); }}
              >
                <span className="topbar__switcher-icon"><Icon size={15} /></span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="topbar__switcher" ref={switcherRef}>
        <button
          type="button"
          className="topbar__icon-btn"
          onClick={() => setSwitcherOpen((v) => !v)}
          aria-label="Switch workspace"
          title="Switch workspace"
        >
          <LayoutGrid size={17} />
        </button>
        {switcherOpen && (
          <div className="topbar__switcher-menu">
            <p className="topbar__switcher-title">Workspaces</p>
            {services.map((service) => {
              const Icon = service.icon;
              const isActive = activeService?.key === service.key;
              return (
                <button
                  key={service.key}
                  type="button"
                  className={`topbar__switcher-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => { setSwitcherOpen(false); navigate(service.home); }}
                >
                  <span className="topbar__switcher-icon" style={{ color: service.accent }}>
                    <Icon size={16} />
                  </span>
                  <span>{service.label}</span>
                  {isActive && <span className="topbar__switcher-dot" />}
                </button>
              );
            })}
            <button
              type="button"
              className="topbar__switcher-item topbar__switcher-all"
              onClick={() => { setSwitcherOpen(false); navigate('/services'); }}
            >
              All workspaces
            </button>
          </div>
        )}
      </div>

      <button type="button" className="topbar__icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <NotificationBell />

      <div className="topbar__user" ref={menuRef}>
        <button type="button" className="topbar__user-trigger" onClick={() => setMenuOpen((v) => !v)}>
          <span className="topbar__avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
          <span className="topbar__user-name">{user?.name}</span>
          <ChevronDown size={14} />
        </button>
        {menuOpen && (
          <div className="topbar__menu">
            <div className="topbar__menu-header">
              <p>{user?.name}</p>
              <span>{user?.email}</span>
            </div>
            <button type="button" onClick={() => { setMenuOpen(false); navigate('/settings/profile'); }}>
              <UserIcon size={15} /> My Profile
            </button>
            <button type="button" onClick={handleLogout}>
              <LogOut size={15} /> Log out
            </button>
          </div>
        )}
      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
