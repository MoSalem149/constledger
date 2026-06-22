import { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { DocIcon } from "../components/icons/DocIcon";
import { FadeLoader } from "react-spinners";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import OverviewCards from "../components/dashboard/OverviewCards";
import ActiveProjectsSection from "../components/dashboard/ActiveProjectsSection";
import FinanceStrategySection from "../components/dashboard/FinanceStrategySection";
import ProjectsTableSection from "../components/dashboard/ProjectsTableSection";
import { useDashboardData } from "../hooks/useDashboardData";

// =================== PAGE ===================
export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const { contracts, activeContracts, plans, reportData, loading } =
    useDashboardData();

  const userName = user?.name || "";
  const hasContracts = contracts.length > 0;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-116px)] flex items-center justify-center">
        <FadeLoader
          height={20}
          margin={2}
          radius={2}
          width={4}
          color="#FF4800"
        />
      </div>
    );
  }

  // Populated state — contracts exist
  if (hasContracts) {
    return (
      <div className="min-h-[calc(100vh-116px)] lg:pr-10 pr-0  flex flex-col gap-6">
        <DashboardHeader projectCount={contracts.length} userName={userName} />
        <OverviewCards
          contracts={contracts}
          activeContracts={activeContracts}
          plans={plans}
          reportData={reportData}
        />
        <ActiveProjectsSection activeContracts={activeContracts} />
        <FinanceStrategySection contracts={contracts} plans={plans} />
        <ProjectsTableSection contracts={contracts} />
      </div>
    );
  }

  // Empty state — no contracts yet
  return (
    <div className="min-h-[calc(100vh-116px)] lg:pr-10 pr-0 font-sans flex flex-col">

      {/* Header */}
      <div>
        <p className="text-xs tracking-widest font-normal text-gray-300 mb-3">
          OVERVIEW
        </p>
        <h1 className="text-2xl font-medium text-text-primary mb-3">
          Good Morning, {userName}
        </h1>
        <p className="text-xs font-normal text-text-secondary">
          No projects under management yet. Start by creating your first project
        </p>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
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
