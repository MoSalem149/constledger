import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

/**
 * DashboardLayout — shared app shell for all authenticated pages.
 *
 * Renders a sidebar (Figma SideBar design) + top bar (Figma NavBar design) +
 * an <Outlet /> where the matched page component renders.
 */
export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-bg-main font-sans">
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-auto">
        <Navbar title={getPageTitle(location.pathname)} />

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Helpers
/* ------------------------------------------------------------------ */

function getPageTitle(path) {
  if (path === "/dashboard") return "Dashboard";
  if (path.startsWith("/contracts/upload")) return "New Project";
  if (path.startsWith("/contracts")) return "Projects";
  if (path === "/reports") return "Reports";
  if (path === "/admin") return "Admin";
  return "";
}
