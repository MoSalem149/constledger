import { Link, useLocation } from "react-router-dom";

function LogoIcon() {
  return (
    <svg
      width="24"
      height="29"
      viewBox="0 0 24 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g clipPath="url(#clip0_logo)">
        <path
          d="M8.69434 3.74358L14.1906 0L14.2506 22.1584L11.4575 23.8625L8.75433 22.1888L8.69434 3.74358Z"
          fill="#FF4800"
        />
        <path
          d="M15.3926 5.84381L19.6123 8.73532L19.5973 18.8556L15.4076 21.3823L15.3926 5.84381Z"
          fill="#242424"
        />
        <path
          d="M7.60221 12.7453L7.59074 21.3179L5.18051 19.7648L5.16992 14.7087L7.60221 12.7453Z"
          fill="#FF4800"
        />
        <path
          d="M7.54566 4.9989L0 9.75549L0.00794001 21.8311L11.2475 28.9991L11.251 25.1795L3.37098 20.0197V11.7028L7.54036 9.01339L7.54566 4.9989Z"
          fill="#FF4800"
        />
        <path
          d="M11.2506 25.1804L11.2471 29L23.9996 21.3528L23.9776 17.6888L11.2506 25.1804Z"
          fill="#242424"
        />
      </g>
      <defs>
        <clipPath id="clip0_logo">
          <rect width="24" height="29" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function DashboardIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M26 16V8C26 7.43333 26.192 6.95867 26.576 6.576C26.96 6.19333 27.4347 6.00133 28 6H40C40.5667 6 41.042 6.192 41.426 6.576C41.81 6.96 42.0013 7.43467 42 8V16C42 16.5667 41.808 17.042 41.424 17.426C41.04 17.81 40.5653 18.0013 40 18H28C27.4333 18 26.9587 17.808 26.576 17.424C26.1933 17.04 26.0013 16.5653 26 16ZM6 24V8C6 7.43333 6.192 6.95867 6.576 6.576C6.96 6.19333 7.43467 6.00133 8 6H20C20.5667 6 21.042 6.192 21.426 6.576C21.81 6.96 22.0013 7.43467 22 8V24C22 24.5667 21.808 25.042 21.424 25.426C21.04 25.81 20.5653 26.0013 20 26H8C7.43333 26 6.95867 25.808 6.576 25.424C6.19333 25.04 6.00133 24.5653 6 24ZM26 40V24C26 23.4333 26.192 22.9587 26.576 22.576C26.96 22.1933 27.4347 22.0013 28 22H40C40.5667 22 41.042 22.192 41.426 22.576C41.81 22.96 42.0013 23.4347 42 24V40C42 40.5667 41.808 41.042 41.424 41.426C41.04 41.81 40.5653 42.0013 40 42H28C27.4333 42 26.9587 41.808 26.576 41.424C26.1933 41.04 26.0013 40.5653 26 40ZM6 40V32C6 31.4333 6.192 30.9587 6.576 30.576C6.96 30.1933 7.43467 30.0013 8 30H20C20.5667 30 21.042 30.192 21.426 30.576C21.81 30.96 22.0013 31.4347 22 32V40C22 40.5667 21.808 41.042 21.424 41.426C21.04 41.81 20.5653 42.0013 20 42H8C7.43333 42 6.95867 41.808 6.576 41.424C6.19333 41.04 6.00133 40.5653 6 40ZM10 22H18V10H10V22ZM30 38H38V26H30V38ZM30 14H38V10H30V14ZM10 38H18V34H10V38Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ProjectsIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 11.8C7 10.12 7 9.28 7.326 8.638C7.61371 8.07301 8.07301 7.61371 8.638 7.326C9.278 7 10.118 7 11.8 7H21.012C21.746 7 22.112 7 22.458 7.082C22.7673 7.15667 23.056 7.27667 23.324 7.442C23.628 7.628 23.886 7.888 24.404 8.406L31.594 15.594C32.114 16.114 32.374 16.374 32.558 16.674C32.7233 16.946 32.8433 17.2353 32.918 17.542C33 17.888 33 18.254 33 18.988V36.2C33 37.88 33 38.72 32.674 39.362C32.3863 39.927 31.927 40.3863 31.362 40.674C30.722 41 29.882 41 28.2 41H11.8C10.12 41 9.28 41 8.638 40.674C8.07301 40.3863 7.61371 39.927 7.326 39.362C7 38.722 7 37.882 7 36.2V11.8Z"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M22 7V14.2C22 15.88 22 16.72 22.328 17.362C22.6152 17.9267 23.0738 18.386 23.638 18.674C24.278 19 25.118 19 26.8 19H34"
        stroke="currentColor"
        strokeWidth="4"
      />
    </svg>
  );
}

function AdminIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 46 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 36C7 33.8783 7.84285 31.8434 9.34315 30.3431C10.8434 28.8429 12.8783 28 15 28H31C33.1217 28 35.1566 28.8429 36.6569 30.3431C38.1571 31.8434 39 33.8783 39 36C39 37.0609 38.5786 38.0783 37.8284 38.8284C37.0783 39.5786 36.0609 40 35 40H11C9.93913 40 8.92172 39.5786 8.17157 38.8284C7.42143 38.0783 7 37.0609 7 36Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M23 20C26.3137 20 29 17.3137 29 14C29 10.6863 26.3137 8 23 8C19.6863 8 17 10.6863 17 14C17 17.3137 19.6863 20 23 20Z"
        stroke="currentColor"
        strokeWidth="4"
      />
    </svg>
  );
}

const navItems = [
  { label: "Dashboard", to: "/dashboard", Icon: DashboardIcon },
  { label: "Projects", to: "/contracts/upload", Icon: ProjectsIcon },
  { label: "Admin", to: "/reports", Icon: AdminIcon },
];

/* ------------------------------------------------------------------ */
// Sidebar
/* ------------------------------------------------------------------ */

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="w-[195px] h-screen bg-white flex flex-col shrink-0
                 shadow-[0_2px_8px_rgba(136,136,136,0.1)]
                 px-[23px] pt-6"
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
        <span
          className="text-xs font-normal font-sans text-text-placeholder 

 "
        >
          MAIN MENU
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-3">
        {navItems.map(({ label, to, Icon }) => {
          const isActive =
            location.pathname === to || location.pathname.startsWith(to + "/");

          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-1 py-1 rounded-md text-base font-medium font-sans transition-colors ${
                isActive
                  ? "border border-status-processing text-text-primary "
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
