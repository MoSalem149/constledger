import { useAuth } from "../../context/AuthContext";

function SearchIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M13.3144 26.6287C9.59317 26.6287 6.44415 25.3396 3.86731 22.7614C1.29047 20.1832 0.00136666 17.0342 1.08379e-06 13.3144C-0.00136449 9.59454 1.28774 6.44552 3.86731 3.86731C6.44689 1.2891 9.5959 0 13.3144 0C17.0328 0 20.1825 1.2891 22.7635 3.86731C25.3444 6.44552 26.6328 9.59454 26.6287 13.3144C26.6287 14.8165 26.3898 16.2333 25.9118 17.5647C25.4339 18.8962 24.7852 20.074 23.9659 21.0982L35.4367 32.569C35.8122 32.9445 36 33.4225 36 34.0028C36 34.5832 35.8122 35.0612 35.4367 35.4367C35.0612 35.8122 34.5832 36 34.0028 36C33.4225 36 32.9445 35.8122 32.569 35.4367L21.0982 23.9659C20.074 24.7852 18.8962 25.4339 17.5647 25.9118C16.2333 26.3898 14.8165 26.6287 13.3144 26.6287ZM13.3144 22.532C15.8748 22.532 18.0516 21.6362 19.8446 19.8446C21.6376 18.0529 22.5334 15.8762 22.532 13.3144C22.5306 10.7525 21.6348 8.5765 19.8446 6.78623C18.0543 4.99596 15.8776 4.09946 13.3144 4.09673C10.7512 4.094 8.57514 4.9905 6.78623 6.78623C4.99733 8.58196 4.10083 10.758 4.09673 13.3144C4.09263 15.8707 4.98913 18.0475 6.78623 19.8446C8.58333 21.6416 10.7594 22.5375 13.3144 22.532Z"
        fill="currentColor"
      />
    </svg>
  );
}

function NotificationIcon({ className }) {
  return (
    <svg
      className={className}
      width="18"
      height="20"
      viewBox="0 0 18 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.95157 7.04843C1.95157 5.17907 2.69417 3.38627 4.01601 2.06444C5.33784 0.7426 7.13064 0 9 0C10.8694 0 12.6622 0.7426 13.984 2.06444C15.3058 3.38627 16.0484 5.17907 16.0484 7.04843V10.8385L17.883 14.5077C17.9675 14.6766 18.0074 14.8642 17.9989 15.0529C17.9904 15.2415 17.9338 15.4248 17.8346 15.5854C17.7353 15.746 17.5966 15.8786 17.4317 15.9705C17.2667 16.0625 17.081 16.1107 16.8922 16.1107H12.9008C12.6768 16.9749 12.1722 17.7402 11.4662 18.2866C10.7602 18.8329 9.89273 19.1294 9 19.1294C8.10727 19.1294 7.23981 18.8329 6.53379 18.2866C5.82778 17.7402 5.32317 16.9749 5.0992 16.1107H1.10777C0.918955 16.1107 0.733262 16.0625 0.568335 15.9705C0.403407 15.8786 0.264719 15.746 0.165445 15.5854C0.0661697 15.4248 0.0096037 15.2415 0.00111898 15.0529C-0.00736574 14.8642 0.0325126 14.6766 0.116966 14.5077L1.95157 10.8385V7.04843ZM7.25602 16.1107C7.43278 16.4168 7.68699 16.671 7.99313 16.8477C8.29926 17.0245 8.64651 17.1175 9 17.1175C9.35348 17.1175 9.70074 17.0245 10.0069 16.8477C10.313 16.671 10.5672 16.4168 10.744 16.1107H7.25602ZM9 2.01384C7.66474 2.01384 6.38417 2.54427 5.44001 3.48843C4.49584 4.4326 3.96541 5.71317 3.96541 7.04843V10.8385C3.96539 11.1509 3.89265 11.4591 3.75295 11.7387L2.57485 14.0969H15.4262L14.2481 11.7387C14.108 11.4592 14.0349 11.151 14.0346 10.8385V7.04843C14.0346 5.71317 13.5042 4.4326 12.56 3.48843C11.6158 2.54427 10.3353 2.01384 9 2.01384Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PersonIcon({ className }) {
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

/* ------------------------------------------------------------------ */
// Helpers
/* ------------------------------------------------------------------ */

function formatRole(role) {
  if (!role) return "";
  // "contractManager" → "Contract Manager"
  return role.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export default function Navbar({ title }) {
  //! commented out for now so we can work on the design without crashing
  // const { user } = useAuth();

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
              {/* //! commented out for now so we can work on the design without crashing */}
              {/* {user?.name || "User"} */}
              Yousef Hany
            </span>
            <span className="text-xs text-text-secondary leading-none whitespace-nowrap">
              {/* //! commented out for now so we can work on the design without crashing */}
              {/* {formatRole(user?.role)} */}
              Contract Manager
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
