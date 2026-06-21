import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg-main font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-auto min-w-0 lg:ml-[195px]">
        <Navbar
          title={getPageTitle(location.pathname)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
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