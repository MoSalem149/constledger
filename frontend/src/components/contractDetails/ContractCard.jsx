import ProjectImage from "../../assets/projectImage.png";
import { formatDate } from "../../utils/formatDate";
import { ArrowRightIcon } from "../icons/ArrowRightIcon";

export const ContarctCard = ({ contractData }) => {
  const paymentProgress = contractData.paymentProgress ?? {
    frequency: 0,
    basis: "—",
    dueTo: "—",
  };

  const formatBudget = (value) => {
    const num = +value;
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
    return num.toLocaleString() + " EGP";
  };

  const nextMilestone = contractData.milestones
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
      data: paymentProgress.frequency,
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
    <div className="ProjectooMainCard rounded-lg overflow-hidden w-full mt-5 shadow">
      <div className="image relative w-full">
        <img
          className="w-full object-cover max-h-64 sm:max-h-80 md:max-h-none"
          src={ProjectImage}
          alt="projectImage"
        />
      </div>

      <div className="content flex flex-col md:flex-row w-full h-full">
        <div className="left bg-bg-cards1 w-full md:w-9/12">
          <div className="top text-sm pt-5 px-5">
            <span className="text-text-secondary mr-4 sm:mr-10">
              {contractData.contractNumber}
            </span>{" "}
            <span className="text-primary bg-bg-cards2/15 px-2 rounded-full">
              Contract Analysis Complete
            </span>
          </div>
          <div className="middle px-5 border-b pb-4">
            <h2 className="text-xl sm:text-2xl my-4">{contractData.name}</h2>
            <p className="text-text-secondary text-sm">
              NREA contracting{" "}
              <span className="text-text-primary">
                {
                  contractData.parties.find((p) => p.role === "main_contractor")
                    ?.name
                }
              </span>
            </p>
          </div>

          <div className="bottom p-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:justify-between sm:items-start">
            {cardBottomData.map((d, index) => (
              <div key={index} className="item text-text-secondary text-sm">
                <p>{d.title}</p>
                <p className="text-text-primary">
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

        <div className="right w-full md:w-3/12 bg-bg-main min-h-[10rem] md:h-full">
          <CircularProgress value={paymentProgress.frequency} />
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
