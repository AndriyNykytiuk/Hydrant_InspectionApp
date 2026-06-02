import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function ProtectedRoute({ children, role, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading">Завантаження...</div>;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  const allowed = roles || (role ? [role] : null);
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to="/hydrants" replace />;
  }
  return children;
}
