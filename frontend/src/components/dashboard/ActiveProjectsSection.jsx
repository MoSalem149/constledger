import { Link } from "react-router-dom";
import ProjectCard from "../contracts/ProjectCard";

// =================== SECTION ===================
export default function ActiveProjectsSection({ activeContracts }) {
  if (!activeContracts || activeContracts.length === 0) return null;

  return (
    <div className="flex flex-col font-sans gap-3">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-medium text-text-primary">
            Active Projects
          </h2>
          <p className="text-xs font-normal text-text-placeholder mt-2">
            Showing all currently active projects
          </p>
        </div>
      </div>

      {/* Scrollable cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {activeContracts.map((contract) => (
          <div key={contract.id} className="snap-start min-w-[280px] w-[280px]">
            <ProjectCard
              contract={contract}
              onClick={() => {
                window.location.href = `/contracts/${contract.id}`;
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
