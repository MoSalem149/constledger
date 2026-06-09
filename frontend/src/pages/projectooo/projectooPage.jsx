import OverView from "./overViewSection";
import ProjectooMainCard from "./ProjectooMainCard";

const ProjectoPage = () => {
  return (
    <div className="project pt-6 sm:pt-10 bg-bg-main">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-text-secondary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5 flex-shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>

          <div className="text-sm sm:text-base">All Projects</div>
        </div>

        <ProjectooMainCard />

        <OverView />
      </div>
    </div>
  );
};

export default ProjectoPage;
