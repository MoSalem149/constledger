import { useAuth } from "../../context/AuthContext";
import SearchIcon from "../icons/SearchIcon";
import NotificationIcon from "../icons/NotificationIcon";
import PersonIcon from "../icons/PersonIcon";

/* ------------------------------------------------------------------ */
// Helpers
/* ------------------------------------------------------------------ */

function formatRole(role) {
  if (!role) return "";
  // "contract_manager" → "Contract Manager"
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function Navbar({ title }) {
  //! comment it out so you can work on the design without crashing
  const { user } = useAuth();

  return (
    <header className="pt-6 flex items-center justify-between pl-5 pr-16">
      {/* Left — title + search (no functionality just visual)*/}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-medium text-text-primary font-sans">
          {title}
        </h1>

        {/* Search placeholder */}
        <div
          className="w-[330px] h-10 bg-white rounded-[28px] flex items-center gap-2 px-4 py-[10px]
                     shadow-[0_2px_8px_rgba(136,136,136,0.1)]"
        >
          <SearchIcon className="w-5 h-5 text-text-secondary shrink-0" />
          <span className="text-xs text-text-placeholder select-none">
            Search ...
          </span>
        </div>
      </div>

      {/* Right — notification + profile */}
      <div className="flex items-center gap-3">
        {/* Notification bell (no action) */}
        <button
          className="w-10 h-10 bg-white rounded-lg flex items-center justify-center
                     shadow-[0_2px_8px_rgba(136,136,136,0.1)]"
          aria-label="Notifications"
        >
          <NotificationIcon className="text-text-secondary w-[18px] h-5" />
        </button>

        {/* Profile card */}
        <div
          className="bg-white rounded-[28px] flex items-center gap-2 px-1.5 py-1
                     shadow-[0_2px_8px_rgba(136,136,136,0.1)]"
        >
          {/* Avatar*/}
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
            <PersonIcon className="text-white w-5 h-5" />
          </div>

          {/* Name + role */}
          <div className="flex flex-col gap-1 pr-3 font-sans">
            <span className="text-xs font-medium text-text-primary leading-none whitespace-nowrap">
              //! comment it out so you can work on the design without crashing
              {user?.name || "User"}
            </span>
            <span className="text-xs text-text-secondary leading-none whitespace-nowrap">
              //! comment it out so you can work on the design without crashing
              {formatRole(user?.role)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
