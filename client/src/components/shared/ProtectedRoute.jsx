import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { canAccessService } from '../../constants/services';
import { isAdminRole, homePathForUser } from '../../constants/roles';
import Spinner from '../ui/Spinner';
import IdleLogoutGuard from './IdleLogoutGuard';

export function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner label="Loading your workspace…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <IdleLogoutGuard />
      <Outlet />
    </>
  );
}

export function AdminRoute() {
  const { user } = useAuth();
  if (!isAdminRole(user?.role)) {
    // Non-admins get bounced to wherever their role actually lands.
    return <Navigate to={homePathForUser(user)} replace />;
  }
  return <Outlet />;
}

/** Gates a whole service namespace on the user's assigned services. */
export function ServiceRoute({ service }) {
  const { user } = useAuth();
  if (!canAccessService(user, service)) {
    return <Navigate to={homePathForUser(user)} replace />;
  }
  return <Outlet />;
}

/** Client Portal is the only thing a client role ever sees — everyone else
 * (admin/superadmin/employee) gets bounced to the regular service launcher. */
export function PortalRoute() {
  const { user } = useAuth();
  if (user?.role !== 'client') {
    return <Navigate to="/services" replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, initializing, user } = useAuth();
  if (initializing) return null;
  if (isAuthenticated) return <Navigate to={homePathForUser(user)} replace />;
  return <Outlet />;
}
