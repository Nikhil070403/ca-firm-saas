import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, Building2, LogOut } from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { useToast } from '../components/shared/Toast';
import { servicesForUser } from '../constants/services';
import './ServiceLauncherPage.css';

/**
 * Post-login hub: the user picks which service to work in. Menus elsewhere
 * are scoped to the chosen service — this is the only place all services
 * appear together. Clients never see this — they land straight in the
 * Client Portal — but redirect them there anyway in case they type the URL.
 */
export default function ServiceLauncherPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (user?.role === 'client') return <Navigate to="/portal" replace />;

  const services = servicesForUser(user);

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    navigate('/login');
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="launcher">
      <header className="launcher__topbar">
        <div className="launcher__brand">
          <span className="launcher__brand-icon"><Building2 size={20} /></span>
          <span>CA Firm SaaS</span>
        </div>
        <button type="button" className="launcher__logout" onClick={handleLogout}>
          <LogOut size={15} />
          Log out
        </button>
      </header>

      <main className="launcher__body">
        <p className="launcher__greeting">{greeting()}, {user?.name?.split(' ')[0]}</p>
        <h1 className="launcher__title">Choose a workspace</h1>
        <p className="launcher__subtitle">
          Pick the service you want to work in. You can switch anytime from the top bar.
        </p>

        <div className="launcher__grid">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.key}
                type="button"
                className="launcher__card"
                onClick={() => navigate(service.home)}
              >
                <span className="launcher__card-icon" style={{ background: `${service.accent}1a`, color: service.accent }}>
                  <Icon size={26} />
                </span>
                <span className="launcher__card-label">{service.label}</span>
                <span className="launcher__card-desc">{service.description}</span>
                <span className="launcher__card-cta">
                  Open {service.label} <ArrowRight size={14} />
                </span>
                {service.adminOnly && <span className="launcher__card-badge">Admin</span>}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
