import ProjectImage from "../../assets/projectImage.png";
import { formatDate } from "../../utils/formatDate";
import { ArrowRightIcon } from "../icons/ArrowRightIcon";

export const ContarctCard = ({ contractData }) => {
  const formatBudget = (value) => {
    const num = Number(value) || 0;
    if (num >= 1_000_000_000)
      return (
        (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") +
        "B " +
        contractData.currency
      );
    if (num >= 1_000_000)
      return (
        (num / 1_000_000).toFixed(1).replace(/\.0$/, "") +
        "M " +
        contractData.currency
      );
    if (num >= 1_000)
      return (
        (num / 1_000).toFixed(1).replace(/\.0$/, "") +
        "K " +
        contractData.currency
      );
    return `${num.toLocaleString()} ${contractData.currency ?? "EGP"}`;
  };

  const nextMilestone = (contractData.milestones ?? [])
    .filter((milestone) => new Date(milestone.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const cardBottomData = [
    {
      title: "Total Budget",
      data: contractData.contract_value,
      format: (v) => formatBudget(v),
    },
    {
      title: "Progress",
      data: 0,
      format: (v) => `${v}%`,
      footerData: "Earned 0 EGP",
    },
    {
      title: "Timeline",
      data: (
        <span className="flex items-center gap-1">
          {formatDate(contractData.start_date)}
          <ArrowRightIcon />
          {formatDate(contractData.end_date)}
        </span>
      ),
    },
    {
      title: "Next Milestone",
      data:
        nextMilestone.length === 0 ? (
          <span style={{ letterSpacing: "-2px" }}>__</span>
        ) : (
          nextMilestone[0].name
        ),
    },
  ];

  return (
    <div className="ProjectooMainCard mt-5 w-full min-w-0 overflow-hidden rounded-xl shadow">
      <div className="image relative h-40 w-full sm:h-52 lg:h-64">
        <img
          className="h-full w-full object-cover"
          src={ProjectImage}
          alt="projectImage"
        />
      </div>

      <div className="content grid w-full md:grid-cols-[minmax(0,3fr)_minmax(220px,1fr)]">
        <div className="left min-w-0 bg-bg-cards1">
          <div className="top flex flex-wrap items-center gap-2 px-4 pt-4 text-xs sm:px-5 sm:pt-5 sm:text-sm">
            <span className="break-all text-text-secondary">
              {contractData.contractNumber}
            </span>
            <span className="rounded-full bg-bg-cards2/15 px-2 py-0.5 text-primary">
              Contract Analysis Complete
            </span>
          </div>
          <div className="middle border-b px-4 pb-4 sm:px-5">
            <h2 className="my-3 break-words text-lg font-medium text-text-primary sm:my-4 sm:text-2xl">
              {contractData.name}
            </h2>
            <p className="text-xs text-text-secondary sm:text-sm">
              NREA contracting{" "}
              <span className="text-text-primary">
                {(contractData.parties ?? []).find(
                  (p) => p.role === "main_contractor",
                )?.name ?? "—"}
              </span>
            </p>
          </div>

          <div className="bottom grid grid-cols-1 gap-4 p-4 min-[420px]:grid-cols-2 sm:p-5 xl:grid-cols-4">
            {cardBottomData.map((d, index) => (
              <div
                key={index}
                className="item min-w-0 text-xs text-text-secondary sm:text-sm"
              >
                <p className="mb-1">{d.title}</p>
                <p className="break-words font-medium text-text-primary">
                  {d.format ? d.format(d.data) : d.data}{" "}
                </p>
                <p>
                  {d.footerData ?? (
                    <span style={{ letterSpacing: "-2px" }}>__</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="right min-h-[12rem] w-full bg-bg-main">
          <CircularProgress value={0} />
        </div>
      </div>
    </div>
  );
};

// CircularProgress
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
