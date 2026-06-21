import { Link } from "react-router-dom";
import { PlusIcon } from "../../components/icons/PlusIcon";
// =================== HELPERS ===================
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

const DashboardHeader = ({ projectCount, userName }) => {
  const greeting = getGreeting();
  const date = getFormattedDate();

  return (
    <div className="flex items-start font-sans justify-between">
      <div>
        <p className="text-xs tracking-widest font-normal text-gray-300 mb-3">
          OVERVIEW . {date}
        </p>
        <h1 className="text-2xl font-medium text-text-primary mb-3">
          {greeting}, {userName}
        </h1>
        <p className="text-xs font-normal text-text-secondary">
          {projectCount} project{projectCount !== 1 ? "s" : ""} under management
        </p>
      </div>

      <Link
        to="/contracts/upload"
        className="inline-flex  bg-button-active shadow-[0px_0px_4px_0px_rgba(255,72,0,1.00)] text-text-light text-sm font-medium px-4 py-2.5  rounded-3xl hover:opacity-90 transition-opacity "
      >
        <PlusIcon className="mr-2" size={14} />
        Add Project
      </Link>
    </div>
  );
};

export default DashboardHeader;
