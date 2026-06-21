import { Link } from "react-router-dom";
import { ArrowRightIcon } from "../icons/ArrowRightIcon";
// =================== HELPERS ===================
const formatValue = (val, currency) => {
  const c = currency ? ` ${currency}` : "";
  if (!Number(val)) return "—";
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M${c}`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K${c}`;
  return `${val}${c}`;
};

const getMainContractor = (parties) => {
  if (!parties || parties.length === 0) return null;
  return (parties.find((p) => p.role === "main_contractor") || parties[0])
    ?.name;
};

const getNextMilestone = (milestones) => {
  if (!milestones || milestones.length === 0) return null;
  const now = new Date();
  const future = milestones
    .filter((m) => m.dueDate && new Date(m.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  if (future.length > 0) return future[0];
  const past = milestones
    .filter((m) => m.dueDate)
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
  return past[0] || null;
};

// Status badges matching the screenshot
const StatusBadge = ({ status }) => {
  const config = {
    active: { label: "Active", bg: "bg-green-100", text: "text-green-700" },
    pending_review: {
      label: "Pending",
      bg: "bg-orange-100",
      text: "text-orange-700",
    },
    needs_attention: {
      label: "Needs Attention",
      bg: "bg-red-100",
      text: "text-red-700",
    },
    analysis_failed: {
      label: "Failed",
      bg: "bg-red-100",
      text: "text-red-700",
    },
    analysing: { label: "Analysing", bg: "bg-blue-100", text: "text-blue-700" },
    slightly_off_plan: {
      label: "Off Plan",
      bg: "bg-yellow-100",
      text: "text-yellow-700",
    },
    on_track: { label: "On Track", bg: "bg-green-100", text: "text-green-700" },
  };

  const cfg = config[status] || {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-700",
  };

  return (
    <span
      className={`${cfg.bg} ${cfg.text} text-[10px] font-semibold px-2 py-[1px] rounded-xs`}
    >
      {cfg.label}
    </span>
  );
};

// =================== TABLE ROW ===================
const TableRow = ({ contract }) => {
  const contractorName = getMainContractor(contract.parties);
  const nextMilestone = getNextMilestone(contract.milestones);

  return (
    <tr className="border-b text-left border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <td className="pl-4 pt-8 pb-6 pr-20 text-xs font-normal">
        <span className=" text-text-secondary ">
          {contract.contractNumber || contract.id?.slice(-8).toUpperCase()}
        </span>
      </td>
      <td className="pl-4 pt-8 pb-6 pr-20">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-primary">
            {contract.name}
          </span>
          {contractorName && (
            <span className="text-xs font-normal text-text-secondary">
              {contractorName}
            </span>
          )}
        </div>
      </td>
      <td className="pl-4 pt-8 pb-6 pr-20">
        <span className="text-sm font-medium text-text-primary">
          {contractorName || "—"}
        </span>
      </td>
      <td className="pl-4 pt-8 pb-6 pr-20">
        <span className="text-xs font-medium text-text-primary">
          {formatValue(contract.contractValue, contract.currency)}
        </span>
      </td>
      <td className="pl-4 pt-8 pb-6 pr-20">
        <StatusBadge status={contract.status} />
      </td>
      <td className="pl-4 pt-8 pb-6 pr-20">
        <span className="text-xs font-medium text-text-primary">
          {nextMilestone?.name || "—"}
        </span>
      </td>
    </tr>
  );
};

// =================== SECTION ===================
export default function ProjectsTableSection({ contracts }) {
  if (!contracts || contracts.length === 0) return null;

  return (
    <div className="flex bg-bg-cards1 rounded-lg shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] flex-col p-6 gap-2">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-medium text-text-primary">
            Project Table View
          </h2>
          <p className="text-xs font-normal text-text-placeholder mt-2">
            All projects with KPIs at a glance
          </p>
        </div>
        <Link
          to="/contracts"
          className="text-primary text-lg font-medium flex items-center gap-1 hover:gap-2 transition-all shrink-0"
        >
          Open Projects Page
          <ArrowRightIcon />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto font-sans bg-bg-cards1 ">
        <table className="table-auto w-full min-w-[800px]">
          <thead>
            <tr className="bg-bg-grey">
              <th className="text-left text-text-secondary text-xs font-normal uppercase pl-4 pt-8 pb-6 pr-20">
                ID
              </th>
              <th className="text-left text-text-secondary text-xs font-normal uppercase pl-4 pt-8 pb-6 pr-20">
                Project
              </th>
              <th className="text-left text-text-secondary text-xs font-normal uppercase pl-4 pt-8 pb-6 pr-20">
                Party
              </th>
              <th className="text-left text-text-secondary text-xs font-normal uppercase pl-4 pt-8 pb-6 pr-20">
                Value
              </th>
              <th className="text-left text-text-secondary text-xs font-normal uppercase pl-4 pt-8 pb-6 pr-20">
                Status
              </th>
              <th className="text-left text-text-secondary text-xs font-normal uppercase pl-4 pt-8 pb-6 pr-20">
                Next Milestone
              </th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <TableRow key={contract.id} contract={contract} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
