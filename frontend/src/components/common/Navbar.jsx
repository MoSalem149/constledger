import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SearchIcon from "../icons/SearchIcon";
import NotificationIcon from "../icons/NotificationIcon";
import PersonIcon from "../icons/PersonIcon";
import LogoutIcon from "../icons/LogoutIcon";

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside the profile card or dropdown.
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);

    await logout();
    navigate("/login", { replace: true });
  }

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

        {/* Profile card + dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((open) => !open)}
            className="bg-white rounded-[28px] flex items-center gap-2 px-1.5 py-1
                       shadow-[0_2px_8px_rgba(136,136,136,0.1)] hover:bg-gray-100 transition-colors"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
          >
            {/* Avatar */}
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
              <PersonIcon className="text-white w-5 h-5" />
            </div>

            {/* Name + role */}
            <div className="flex flex-col gap-1 pr-3 font-sans text-left">
              <span className="text-xs font-medium text-text-primary leading-none whitespace-nowrap">
                {user?.name || "User"}
              </span>
              <span className="text-xs text-text-secondary leading-none whitespace-nowrap">
                {formatRole(user?.role)}
              </span>
            </div>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div
              ref={dropdownRef}
              role="menu"
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl font-sans
                         shadow-[0_2px_8px_rgba(136,136,136,0.1)] py-3 px-3 z-50"
            >
              {/* User info */}
              <div className="flex items-center gap-3 px-2 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shrink-0">
                  <PersonIcon className="text-white w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs text-text-secondary truncate">
                    {formatRole(user?.role)}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-2 py-2.5 mt-2 rounded-xl
                           text-text-secondary hover:bg-gray-100 transition-colors"
                role="menuitem"
              >
                <LogoutIcon className="w-5 h-5" />
                <span className="text-sm font-medium font-sans">Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
