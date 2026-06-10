import { projectCard } from "../../data/projectData";

const formatBudget = (value) => {
  const num = +value;
  if (num >= 1_000_000_000)
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B EGP";
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M EGP";
  if (num >= 1_000)
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K EGP";
  return num.toLocaleString() + " EGP";
};

const cardBottomData = [
  {
    title: "Total Budget",
    data: projectCard.TotalBudget,
  },
  {
    title: "Progress",
    data: projectCard.Progress,
    footerData: "Earned 0 EGP",
  },
  {
    title: "Timeline",
    data: `${projectCard.Timeline.from} -> ${projectCard.Timeline.to}`,
  },
  {
    title: "Next Milestone",
    data: projectCard.NextMilestone,
  },
];

export const ContarctCard = () => {
  return (
    <div className="ProjectooMainCard rounded-lg overflow-hidden w-full mt-5 shadow">
      <div className="image relative w-full">
        <img
          className="w-full object-cover max-h-64 sm:max-h-80 md:max-h-none"
          src={projectCard.projectImage}
          alt="projectImage"
        />
      </div>

      <div className="content flex flex-col md:flex-row w-full h-full">
        <div className="left bg-bg-cards1 w-full md:w-9/12">
          <div className="top text-sm pt-5 px-5">
            <span className="text-text-secondary mr-4 sm:mr-10">
              {projectCard.projectId}
            </span>{" "}
            <span className="text-primary bg-bg-cards2/15 px-2 rounded-full">
              Contract Analysis Complete
            </span>
          </div>
          <div className="middle px-5 border-b pb-4">
            <h2 className="text-xl sm:text-2xl my-4">
              {projectCard.projectTitle}
            </h2>
            <p className="text-text-secondary text-sm">
              NREA contracting{" "}
              <span className="text-text-primary">
                {projectCard.NREAContracting}
              </span>
            </p>
          </div>

          <div className="bottom p-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:justify-between sm:items-start">
            {cardBottomData.map((d, index) => (
              <div key={index} className="item text-text-secondary text-sm">
                <p>{d.title}</p>
                <p className="text-text-primary">
                  {d.title === "Total Budget"
                    ? formatBudget(d.data)
                    : d.title === "Progress"
                      ? d.data + "%"
                      : d.data}
                </p>
                <p>{d.footerData ? d.footerData : "__"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="right w-full md:w-3/12 bg-bg-main min-h-[10rem] md:h-full">
          <CircularProgress value={projectCard.Progress} />
        </div>
      </div>
    </div>
  );
};

// CircularProgress.jsx
const CircularProgress = ({ value = 0 }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
      <p className="text-text-secondary text-sm font-medium">Progress</p>

      <div className="relative flex items-center justify-center w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-bg-grey"
          />
          {/* Progress */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-primary transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-text-primary text-lg font-semibold">
          {value}%
        </span>
      </div>

      <p className="text-text-secondary text-xs text-center">
        Project progress will <br /> appear here
      </p>
    </div>
  );
};
