import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FullPageSpinner from './FullPageSpinner';

/**
 * PrivateRoute — auth gate that wraps every protected page.
 *
 * If auth is still loading (checking cookie on mount) → show spinner.
 * If no valid session → redirect to /login.
 * If authenticated → render the matched child route via <Outlet />.
 *
 * Nesting: App.jsx wraps all protected routes under:
 *   <Route element={<PrivateRoute />}>
 *     ...all protected pages...
 *   </Route>
 * This means one declaration protects every route inside.
 */
export default function PrivateRoute() {
  const { loading, isAuthenticated } = useAuth();

  // Still checking cookie — show spinner (prevents flash of /login redirect)
  if (loading) return <FullPageSpinner />;

  // No valid session — go to login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Authenticated — render child routes (the <Outlet /> in Route tree)
  return <Outlet />;
}
