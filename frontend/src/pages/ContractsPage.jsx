import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SearchIcon from "../components/icons/SearchIcon";
import { ArrowRightIcon } from "../components/icons/ArrowRightIcon";
import { PlusIcon } from "../components/icons/PlusIcon";
import SpinnerIcon from "../components/icons/SpinnerIcon";
import { EmptyIcon } from "../components/icons/EmptyIcon";
import { TrashIcon } from "../components/icons/TrashIcon";
import projectImage from "../assets/projectImage.png";
import { contractService } from "../services/contractService";
import FullPageSpinner from "../components/common/FullPageSpinner";
import DeleteContractModal from "../components/contracts/DeleteContractModal";
import { useAuth } from "../context/AuthContext";

// =================== HELPERS ===================
const formatValue = (val, currency) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M ${currency}`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K ${currency}`;
  return `${val} ${currency}`;
};
const formatDate = (d) => {
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
  needs_attention: { label: "Needs Attention", bg: "bg-status-risk" }, // #FF0000
  analysing: { label: "Analysing Contract", bg: "bg-bg-processing" }, // #DDE9F8
  slightly_off_plan: { label: "Slightly off plan", bg: "bg-watch-2" }, // #F69521
  on_track: { label: "On Track", bg: "bg-status-track" }, // #007D0F
  active: { label: "Active", bg: "bg-status-processing" }, // #1D6CD3
  pending_review: { label: "Pending Review", bg: "bg-gray-300" }, // #A5A4A3
  analysis_failed: { label: "Analysis Failed", bg: "bg-status-risk" }, // #FF0000
};

// =================== STATUS BADGE ===================
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

// =================== CONTRACT CARD ===================
const ContractCard = ({ contract, onClick, canDelete, onDelete }) => {
  const { status } = contract;

  return (
    <div
      onClick={onClick}
      className="bg-bg-cards1 rounded-xl overflow-hidden border border-border cursor-pointer
        hover:shadow-md transition-shadow duration-200 flex flex-col"
    >
      {/* Image */}

      <div className="relative h-[120px] overflow-hidden">
        <img
          src={projectImage}
          alt={"project image"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-2 left-2">
          <span className="bg-black/50 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
            {contract.id.slice(-8).toUpperCase()}
          </span>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <StatusBadge status={status} />
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(contract);
              }}
              aria-label="Delete project"
              className="w-6 h-6 rounded-full bg-black/50 hover:bg-status-risk flex items-center justify-center transition-colors"
            >
              <TrashIcon className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1 gap-3">
        {/* Name */}
        <h3 className="text-[13.5px] font-semibold text-text-primary leading-snug">
          {contract.name}
        </h3>

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

// =================== ADD NEW CARD ===================
const AddNewCard = () => (
  <Link
    to="/contracts/upload"
    className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center
      gap-3 p-8 hover:border-primary hover:bg-primary/5 transition-all duration-200 min-h-[220px]"
  >
    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
      <PlusIcon />
    </div>
    <div className="text-center">
      <p className="text-[14px] font-semibold text-text-primary">
        Add a New Project
      </p>
      <p className="text-[12px] text-text-secondary mt-0.5">
        Upload contract . AI extracts the rest
      </p>
    </div>
  </Link>
);

// =================== SEARCH BAR ===================
const SearchBar = ({ value, onChange }) => (
  <div className="relative w-full max-w-xs">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
      <SearchIcon />
    </span>
    <input
      type="text"
      placeholder="Search by name or ID ..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-9 pr-4 py-2.5 bg-bg-cards1 border border-border rounded-full
        text-[13px] text-text-primary placeholder:text-text-secondary
        outline-none focus:border-primary transition-colors shadow-sm"
    />
  </div>
);

// =================== PAGE ===================
const ContractsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canDelete = user?.role === "contract_manager";
  const [search, setSearch] = useState({ searchValue: "", active: false });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleSearch = (searchVal) => {
    if (searchVal.length > 0)
      setSearch((prev) => ({ ...prev, searchValue: searchVal, active: true }));
    else setSearch((prev) => ({ ...prev, searchValue: "", active: false }));
  };

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContract() {
      try {
        const data = await contractService.getContracts();
        setContracts(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    }
    fetchContract();
  }, []);

  const handleDeleted = (deleted) => {
    setContracts((prev) => prev.filter((c) => c.id !== deleted.id));
    setDeleteTarget(null);
  };

  const filtered = contracts.filter(
    (c) =>
      (c.name.toLowerCase().includes(search.searchValue.toLowerCase()) ||
        c.id.toLowerCase().includes(search.searchValue.toLowerCase())) &&
      c.status !== "analysis_failed" &&
      c.status !== "processing",
  );
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-116px)] pr-10">
        <FullPageSpinner />
      </div>
    );
  }

  return (
    <div className="bg-bg-main min-h-[calc(100vh-116px)]  pr-10">
      <div className="mb-6">
        <SearchBar value={search.searchValue} onChange={handleSearch} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((contract) => (
          <ContractCard
            key={contract.id}
            contract={contract}
            onClick={() => navigate(`/contracts/${contract.id}`)}
            canDelete={canDelete}
            onDelete={(c) => setDeleteTarget(c)}
          />
        ))}
        {!search.searchValue && <AddNewCard />}
      </div>

      {filtered.length === 0 && search.active && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <EmptyIcon />
          <p className="text-[14px] text-text-secondary mt-3">
            No contracts match "<strong>{search.searchValue}</strong>"
          </p>
        </div>
      )}

      {deleteTarget && (
        <DeleteContractModal
          contract={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default ContractsPage;