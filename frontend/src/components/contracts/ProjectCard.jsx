import projectImage from "../../assets/projectImage.png";
import { ArrowRightIcon } from "../icons/ArrowRightIcon";

// =================== HELPERS ===================
export const formatValue = (val, currency) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M ${currency}`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K ${currency}`;
  return `${val} ${currency}`;
};

export const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const STATUS_CONFIG = {
  needs_attention: { label: "Needs Attention", bg: "bg-status-risk" },
  analysing: { label: "Analysing Contract", bg: "bg-bg-processing" },
  slightly_off_plan: { label: "Slightly off plan", bg: "bg-watch-2" },
  on_track: { label: "On Track", bg: "bg-status-track" },
  active: { label: "Active", bg: "bg-status-processing" },
  pending_review: { label: "Pending Review", bg: "bg-gray-300" },
  analysis_failed: { label: "Analysis Failed", bg: "bg-status-risk" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: "bg-gray-300" };
  const isLight = status === "analysing";
  return (
    <span
      className={`${cfg.bg} ${isLight ? "text-status-processing" : "text-white"}
        text-[10px] font-semibold px-2 py-0.5 rounded-full`}
    >
      {cfg.label}
    </span>
  );
};

const ProjectCard = ({ contract, onClick }) => {
  const { status } = contract;
  const contractorName = contract.parties?.find(
    (p) => p.role === "main_contractor",
  )?.name;

  return (
    <div
      onClick={onClick}
      className="bg-bg-cards1 rounded-lg  shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] overflow-hidden cursor-pointer
        hover:shadow-md transition-shadow duration-200 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-[120px] overflow-hidden">
        <img
          src={projectImage}
          alt="project image"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-2 left-2">
          <span className="bg-black/50 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
            {contract.id?.slice(-8).toUpperCase()}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1 gap-3">
        {/* Name + Contractor */}
        <div>
          <h3 className="text-[13.5px] font-semibold text-text-primary leading-snug">
            {contract.name}
          </h3>
          {contractorName && (
            <p className="text-[12px] text-text-secondary mt-0.5">
              {contractorName}
            </p>
          )}
        </div>

        {/* Value + Dates */}
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-[10.5px] text-text-secondary block mb-0.5">
              Contract Value
            </span>
            <span className="text-[14px] font-bold text-text-primary">
              {formatValue(contract.contractValue, contract.currency)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10.5px] text-text-secondary block mb-0.5">
                Start Date
              </span>
              <span className="text-[12.5px] font-medium text-text-primary">
                {formatDate(contract.startDate)}
              </span>
            </div>
            <div>
              <span className="text-[10.5px] text-text-secondary block mb-0.5">
                End Date
              </span>
              <span className="text-[12.5px] font-medium text-text-primary">
                {formatDate(contract.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          <button className="text-primary text-[12px] font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Open Project
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
