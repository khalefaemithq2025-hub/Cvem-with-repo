import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { UserRole, toUserRole, ROLE_HOME } from '../lib/rbac';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Wraps a route and enforces RBAC.
 * - If not logged in → redirect to /login (or role-specific login).
 * - If logged in but wrong role → redirect to the user's authorized home.
 */
export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user } = useStore();
  const location = useLocation();

  if (!user) {
    if (localStorage.getItem('logging_out') === '1') return null;
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const userRole = toUserRole(user.role);
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={ROLE_HOME[userRole]} replace />;
  }

  return <>{children}</>;
}
