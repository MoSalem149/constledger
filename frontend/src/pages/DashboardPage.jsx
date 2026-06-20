import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { DocIcon } from "../components/icons/DocIcon";

// =================== UTILS ===================
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const getFormattedDate = () => {
  const now = new Date();
  const day = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const date = now.getDate();
  const month = now
    .toLocaleDateString("en-US", { month: "long" })
    .toUpperCase();
  const year = now.getFullYear();
  return `${day}, ${date} ${month} ${year}`;
};

// =================== PAGE ===================
export default function DashboardPage() {
  const greeting = useMemo(getGreeting, []);
  const date = useMemo(getFormattedDate, []);
  const { user } = useContext(AuthContext);

  const userName = user.name;

  return (
    <div className="min-h-[calc(100vh-116px)] flex flex-col">
      {/* Header */}
      <div>
        <p className="text-[11px] tracking-widest text-text-secondary mb-1.5">
          OVERVIEW . {date}
        </p>
        <h1 className="text-[26px] font-medium text-text-primary mb-1">
          {greeting}, {userName}
        </h1>
        <p className="text-sm text-text-secondary">
          No projects under management yet. Start by creating your first project
        </p>
      </div>

      {/* Empty State — vertically centered in remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Icon + decorative dot */}
        <div className="relative mb-5">
          <div className="w-14 h-14 rounded-xl border border-gray-200 bg-bg-cards1 flex items-center justify-center text-text-secondary shadow-sm">
            <DocIcon />
          </div>
        </div>

        <h2 className="text-[19px] font-semibold text-text-primary mb-2">
          No Projects Yet
        </h2>

        <p className="text-sm text-text-secondary max-w-[300px] leading-relaxed mb-6">
          You haven't created any projects yet. Start by adding your first
          project to track progress and manage contracts.
        </p>

        <Link
          to="/contracts/upload"
          className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity"
        >
          Add First Project
        </Link>
      </div>
    </div>
  );
}
