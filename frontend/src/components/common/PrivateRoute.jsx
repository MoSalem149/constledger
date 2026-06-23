import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FullPageSpinner from './FullPageSpinner';

/**
 * PrivateRoute — auth gate that wraps every protected page.
 *
 * On mount, calls checkSession() to verify the httpOnly cookie with the
 * backend. While the check is in flight, shows a spinner to prevent a
 * flash redirect to /login.
 *
 * Once the check resolves:
 *   - valid session → render the matched child route via <Outlet />
 *   - no session    → redirect to /login
 *
 * Nesting: App.jsx wraps all protected routes under:
 *   <Route element={<PrivateRoute />}>
 *     ...all protected pages...
 *   </Route>
 */
export default function PrivateRoute() {
  const { loading, isAuthenticated, checkSession } = useAuth();

  // Restore session from cookie on mount. This is NOT called when the user
  // opens the public /login page — only when a protected route is accessed.
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Still verifying the cookie — show spinner (prevents flash redirect)
  if (loading) return <FullPageSpinner />;

  // No valid session — go to login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Authenticated — render child routes
  return <Outlet />;
}
