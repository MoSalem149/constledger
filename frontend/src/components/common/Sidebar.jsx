import { Link, useLocation } from "react-router-dom";
import LogoIcon from "../icons/LogoIcon";
import DashboardIcon from "../icons/DashboardIcon";
import FileDocIcon from "../icons/FileDocIcon";
import ReportsIcon from "../icons/ReportsIcon";
import PersonIcon from "../icons/PersonIcon";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/dashboard", Icon: DashboardIcon },
  { label: "Projects", to: "/contracts", Icon: FileDocIcon },
  { label: "Reports", to: "/reports", Icon: ReportsIcon },
  { label: "Admin", to: "/admin", Icon: PersonIcon, requiredRole: "pmo" },
];

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) {
  const location = useLocation();
  const { user } = useAuth();
  const isPmo = user?.role === "pmo";
  const visibleItems = navItems.filter((item) =>
    isPmo ? item.requiredRole === "pmo" : !item.requiredRole,
  );

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30
        w-[195px] bg-white flex flex-col
        shadow-[0_2px_8px_rgba(136,136,136,0.1)]
        px-[23px] pt-6
        transition-[width,transform,padding] duration-300 ease-in-out
        -translate-x-full
        lg:translate-x-0
        ${isCollapsed ? "lg:w-[72px] lg:px-4" : "lg:w-[195px] lg:px-[23px]"}
        ${isOpen ? "translate-x-0" : ""}
      `}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-7 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-gray-100 bg-bg-cards1 text-text-secondary shadow transition-colors hover:border-primary hover:bg-primary hover:text-white lg:flex"
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-300 ${
            isCollapsed ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m12.5 5-5 5 5 5" />
        </svg>
      </button>

      {/* Brand — Logo + two-tone wordmark */}
      <Link
        to="/dashboard"
        onClick={onClose}
        aria-label="Go to dashboard"
        title={isCollapsed ? "Dashboard" : undefined}
        className={`flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isCollapsed ? "lg:justify-center lg:gap-0" : ""
        }`}
      >
        <LogoIcon />
        <span
          className={`whitespace-nowrap text-sm font-medium font-sans ${
            isCollapsed ? "lg:hidden" : ""
          }`}
        >
          <span className="text-text-primary">Const</span>
          <span className="text-primary">Ledger</span>
        </span>
      </Link>

      {/* Section label */}
      <div className={`mt-9 mb-2 ${isCollapsed ? "lg:hidden" : ""}`}>
        <span className="text-xs font-normal font-sans text-text-placeholder">
          MAIN MENU
        </span>
      </div>

      {/* Nav links */}
      <nav
        className={`flex flex-col gap-3 ${isCollapsed ? "lg:mt-9" : ""}`}
      >
        {visibleItems.map(({ label, to, Icon }) => {
          const isActive =
            location.pathname === to || location.pathname.startsWith(to + "/");

          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              title={isCollapsed ? label : undefined}
              aria-label={isCollapsed ? label : undefined}
              className={`flex min-h-9 items-center gap-3 rounded-md px-1 py-1 text-base font-medium font-sans transition-colors ${
                isCollapsed
                  ? "lg:justify-center lg:gap-0 lg:px-2"
                  : ""
              } ${
                isActive
                  ? "border border-status-processing text-text-primary"
                  : "text-text-secondary hover:bg-gray-100"
              }`}
            >
              <Icon
                className={
                  isActive ? "text-text-primary" : "text-text-secondary"
                }
              />
              <span className={isCollapsed ? "lg:hidden" : ""}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
