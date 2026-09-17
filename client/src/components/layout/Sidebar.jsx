import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, ArrowLeftRight } from 'lucide-react';
import { SERVICE_MENUS, serviceForPath } from '../../constants/services';
import { isAdminRole } from '../../constants/roles';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useBranding } from '../../features/settings/context/BrandingContext';
import './Sidebar.css';

/**
 * Service-scoped sidebar: only the menu groups of the active service are
 * rendered. Groups collapse/expand; the group containing the current route
 * always auto-expands so the active link is never hidden.
 */
export default function Sidebar({ isOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const branding = useBranding();
  const service = serviceForPath(location.pathname);
  const allGroups = service ? SERVICE_MENUS[service.key] : [];
  const groups = allGroups.filter((g) => !g.adminOnly || isAdminRole(user?.role));
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    // Auto-expand the group that owns the current route.
    const owner = groups.find((g) => g.items.some((i) => location.pathname.startsWith(i.path)));
    if (owner && collapsed[owner.group]) {
      setCollapsed((prev) => ({ ...prev, [owner.group]: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!service) return null;
  const ServiceIcon = service.icon;

  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar__brand">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="" className="sidebar__brand-logo" />
        ) : (
          <Building2 size={20} />
        )}
        <span>{branding.name || 'CA Firm SaaS'}</span>
      </div>

      <button
        type="button"
        className="sidebar__service"
        onClick={() => navigate('/services')}
        title="Switch workspace"
      >
        <span className="sidebar__service-icon" style={{ color: service.accent }}>
          <ServiceIcon size={17} />
        </span>
        <span className="sidebar__service-label">{service.label}</span>
        <ArrowLeftRight size={14} className="sidebar__service-switch" />
      </button>

      <nav className="sidebar__nav">
        {groups.map((group) => {
          const isCollapsed = Boolean(collapsed[group.group]);
          return (
            <div key={group.group} className="sidebar__group">
              <button
                type="button"
                className="sidebar__group-title"
                onClick={() => setCollapsed((prev) => ({ ...prev, [group.group]: !isCollapsed }))}
              >
                <span>{group.group}</span>
                <ChevronDown size={13} className={`sidebar__chevron ${isCollapsed ? 'is-collapsed' : ''}`} />
              </button>
              {!isCollapsed && group.items.map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
