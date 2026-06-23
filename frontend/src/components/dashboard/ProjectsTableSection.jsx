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

// Formats the project ID:
//   1. If a human-readable contractNumber exists (e.g. "CPMS-<uuid>") use the
//      last 8 chars of the UUID portion so we get something like "CPMS-A1B2C3D4".
//   2. Otherwise fall back to the last 8 chars of the MongoDB _id.
const formatProjectId = (contractNumber, id) => {
  if (contractNumber) {
    // contractNumber is "CPMS-<uuid>" — keep the prefix + last 8 of the uuid
    const parts = contractNumber.split("-");
    if (parts.length > 1) {
      const suffix = parts.slice(1).join("").slice(-8).toUpperCase();
      return `CPMS-${suffix}`;
    }
    return contractNumber;
  }
  if (id) return `#${id.slice(-8).toUpperCase()}`;
  return "—";
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

// Download icon — inline SVG so no extra dep is needed
const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// =================== TABLE ROW ===================
const TableRow = ({ contract }) => {
  const contractorName = getMainContractor(contract.parties);
  const nextMilestone = getNextMilestone(contract.milestones);
  const projectId = formatProjectId(contract.contractNumber, contract.id);

  // Trigger a contract download via the presigned URL returned by GET /api/contracts/:id.
  // We fetch the full contract detail here (which already includes document.pdfUrl)
  // and then open the URL in a new tab — no blob handling needed because S3
  // presigned URLs stream the file directly to the browser.
  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/contracts/${contract.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch contract details");
      const data = await res.json();
      const pdfUrl = data?.document?.pdfUrl;
      if (!pdfUrl) {
        alert("No document is attached to this contract.");
        return;
      }
      // Open the presigned S3 URL — the browser will download or preview the PDF
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Download failed:", err);
      alert("Could not download the contract. Please try again.");
    }
  };

  return (
    <tr className="border-b text-left border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <td className="pl-4 pt-8 pb-6 pr-20 text-xs font-normal">
        <span className="font-mono text-[11px] tracking-wide text-text-secondary bg-gray-100 px-2 py-0.5 rounded">
          {projectId}
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
      {/* Download column */}
      <td className="pl-4 pt-8 pb-6 pr-4">
        <button
          onClick={handleDownload}
          title="Download contract"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
        >
          <DownloadIcon />
          <span>Download</span>
        </button>
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
        <table className="table-auto w-full min-w-[900px]">
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
              <th className="text-left text-text-secondary text-xs font-normal uppercase pl-4 pt-8 pb-6 pr-4">
                Contract
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