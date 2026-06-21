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

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const isPmo = user?.role === "pmo";
  const visibleItems = navItems.filter(
    (item) => (isPmo ? item.requiredRole === "pmo" : !item.requiredRole)
  );

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30
        w-[195px] bg-white flex flex-col
        shadow-[0_2px_8px_rgba(136,136,136,0.1)]
        px-[23px] pt-6
        transition-transform duration-300 ease-in-out
        -translate-x-full
        lg:translate-x-0
        ${isOpen ? "translate-x-0" : ""}
      `}
    >
      {/* Brand — Logo + two-tone wordmark */}
      <div className="flex items-center gap-2">
        <LogoIcon />
        <span className="text-sm font-medium font-sans">
          <span className="text-text-primary">Const</span>
          <span className="text-primary">Ledger</span>
        </span>
      </div>

      {/* Section label */}
      <div className="mt-9 mb-2">
        <span className="text-xs font-normal font-sans text-text-placeholder">
          MAIN MENU
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-3">
        {visibleItems.map(({ label, to, Icon }) => {
          const isActive =
            location.pathname === to || location.pathname.startsWith(to + "/");

          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-1 py-1 rounded-md text-base font-medium font-sans transition-colors ${
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
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}