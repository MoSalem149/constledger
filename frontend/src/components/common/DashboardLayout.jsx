import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * DashboardLayout — shared app shell for all authenticated pages.
 *
 * Renders a sidebar (role-aware nav) + top bar (user info + logout) +
 * an <Outlet /> where the matched page component renders.
 *
 * This lives between PrivateRoute and the page routes, so every
 * authenticated page automatically gets the sidebar + topbar.
 *
 * NOTE: Sidebar nav links are stubs for now. Full role-aware nav
 * will be built in Sprint 3.
 */
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Helper to check if a link is active
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-bg-main font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow flex flex-col">
        {/* Brand / Logo area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold text-primary">ConstLedger</span>
        </div>

        {/* Nav links — stubs for now, full role-aware nav in S3 */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink to="/dashboard" active={isActive('/dashboard')}>
            Dashboard
          </NavLink>
          <NavLink to="/contracts/upload" active={isActive('/contracts/upload')}>
            Upload Contract
          </NavLink>
          <NavLink to="/finance" active={isActive('/finance')}>
            Finance
          </NavLink>
          <NavLink to="/reports" active={isActive('/reports')}>
            Reports
          </NavLink>
        </nav>

        {/* Bottom section */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="text-sm text-text-secondary">
            <p className="font-medium text-text-primary">{user?.name}</p>
            <p className="capitalize">{user?.role}</p>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {getPageTitle(location.pathname)}
          </h2>
          <button
            onClick={logout}
            className="text-sm text-text-secondary hover:text-status-risk transition-colors"
          >
            Logout
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Helper components
/* ------------------------------------------------------------------ */

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-bg-mainColor text-primary'
          : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
      }`}
    >
      {children}
    </Link>
  );
}

function getPageTitle(path) {
  if (path === '/dashboard') return 'Dashboard';
  if (path.startsWith('/contracts/upload')) return 'Upload Contract';
  if (path.startsWith('/contracts')) return 'Contract Details';
  if (path.startsWith('/finance')) return 'Finance';
  if (path === '/reports') return 'Reports';
  return '';
}
