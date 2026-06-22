import React, { useState, useEffect, useRef, useCallback } from "react";
import { reportService } from "../services/reportService";
import { DollarIcon } from "../components/icons/DollarIcon";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import { Link } from "react-router-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** 438410455 → "438,410,455" */
function formatFull(value) {
  if (value == null) return "—";
  return Number(value).toLocaleString("en-EG");
}

/** 47400000 → "47.4M" */
function formatShort(value) {
  if (value == null) return "—";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

/** "2026-05-02" → "2 May 2026" */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Pick the main_contractor name, fall back to first party */
function getPartyName(parties = []) {
  const main = parties.find((p) => p.role === "main_contractor");
  return main?.name || parties[0]?.name || "—";
}

// ─── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CFG = {
  active: { label: "Active", cls: "bg-bg-onTrak   text-status-track" },
  pending: { label: "Pending", cls: "bg-bg-atRisk100 text-watch-2" },
  in_review: {
    label: "In Review",
    cls: "bg-bg-processing text-status-processing",
  },
  completed: { label: "Completed", cls: "bg-gray-100    text-text-secondary" },
  draft: { label: "Draft", cls: "bg-gray-100    text-text-secondary" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? {
    label: status,
    cls: "bg-gray-100 text-text-secondary",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

const BarsIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconInfo = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconChevronDown = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconChevronLeft = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, loading }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-bg-mainColor text-primary flex-shrink-0">
          {icon}
        </span>
        <span className="text-xs text-text-secondary font-medium leading-tight min-w-0">
          {label}
        </span>
      </div>
      <p className="text-lg sm:text-xl font-bold text-text-primary tracking-tight break-words">
        {loading ? (
          <span className="text-gray-200 animate-pulse">———</span>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

// ─── Filter Dropdown ───────────────────────────────────────────────────────────

function FilterDropdown({ placeholder, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : placeholder;

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full select-none items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-gray-300 sm:w-auto"
      >
        <span
          className={selected ? "text-text-primary" : "text-text-secondary"}
        >
          {displayLabel}
        </span>
        <IconChevronDown />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-full min-w-[170px] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-DEFAULT sm:w-auto">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-bg-main
                ${value === opt.value ? "text-primary font-semibold" : "text-text-primary"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter options ────────────────────────────────────────────────────────────

const YEAR_OPTIONS = [
  { value: "", label: "All Years" },
  { value: "2026", label: "2026" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending_review", label: "Pending" },
];

function ContractMobileCard({ contract }) {
  const projectName =
    contract.projectName ?? contract.project?.name ?? contract.name ?? "—";

  return (
    <article className="rounded-xl border border-border bg-bg-cards1 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-medium text-text-primary">
            {projectName}
          </p>
          <p className="mt-1 break-words text-xs text-text-secondary">
            {getPartyName(contract.parties)}
          </p>
        </div>
        <StatusBadge status={contract.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-placeholder">
            Value
          </p>
          <p className="mt-1 text-sm font-medium text-text-primary">
            {formatShort(contract.contractValue)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-placeholder">
            Start
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {formatDate(contract.startDate)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-placeholder">
            End
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {formatDate(contract.endDate)}
          </p>
        </div>
      </div>
    </article>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const ContractsReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (year) params.year = year;
      if (status) params.status = status;
      const result = await reportService.getContracts(params);
      setData(result);
    } catch {
      setError("Failed to load contracts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [year, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const contracts = data?.contracts ?? [];
  const contractCount = data?.contractCount ?? 0;
  const egpEntry =
    data?.totalsByCurrency?.find((t) => t.currency === "EGP") ??
    data?.totalsByCurrency?.[0];
  const totalValue = egpEntry?.totalValue ?? 0;
  const currency = egpEntry?.currency ?? "EGP";
  const activeCount = contracts.filter((c) => c.status === "active").length;
  const inReviewCount = contracts.filter(
    (c) => c.status === "pending_review",
  ).length;

  const handleExport = async () => {
    await reportService.exportContracts({
      ...(year && { year }),
      ...(status && { status }),
    });
  };
  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full min-w-0 bg-bg-main">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          {/* Title */}
          <div>
            <h1 className="text-[22px] font-bold text-text-primary tracking-tight leading-tight">
              All Contracts
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              All projects · portfolio-wide
            </p>
          </div>

          {/* Actions */}
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
            <Link
              to={"/reports"}
              className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-main sm:px-4 sm:text-sm"
            >
              <ArrowLeftIcon />
              Back
            </Link>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:px-5 sm:text-sm"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="mb-6 mt-5 grid grid-cols-1 gap-3 sm:flex sm:items-center">
          <FilterDropdown
            placeholder="Filter by year"
            value={year}
            options={YEAR_OPTIONS}
            onChange={setYear}
          />
          <FilterDropdown
            placeholder="Filter by status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={setStatus}
          />
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="">
        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4 xl:gap-4">
          <StatCard
            icon={<DollarIcon />}
            label="Total Contracts Value"
            loading={loading}
            value={`${formatFull(totalValue)} ${currency}`}
          />
          <StatCard
            icon={<BarsIcon />}
            label="Total Contracts"
            loading={loading}
            value={contractCount}
          />
          <StatCard
            icon={<IconCheck />}
            label="Active Contracts"
            loading={loading}
            value={activeCount}
          />
          <StatCard
            icon={<IconInfo />}
            label="In Review"
            loading={loading}
            value={inReviewCount}
          />
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="rounded-lg bg-white p-3 shadow sm:p-4 lg:p-6">
          <div className="min-w-0">
            <div className="md:hidden">
              {loading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-36 animate-pulse rounded-xl bg-gray-100"
                    />
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <p className="text-sm text-status-risk">{error}</p>
                  <button
                    type="button"
                    onClick={fetchData}
                    className="text-xs text-primary underline underline-offset-2"
                  >
                    Try again
                  </button>
                </div>
              ) : contracts.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-center text-sm text-text-secondary">
                  No contracts match the selected filters.
                </div>
              ) : (
                <div className="grid gap-3">
                  {contracts.map((contract, idx) => (
                    <ContractMobileCard
                      key={contract.id ?? idx}
                      contract={contract}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
            {loading ? (
              /* Loading skeleton rows */
              <table className="w-full min-w-[820px]">
                <thead>
                  <TableHead />
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-5">
                          <div
                            className="h-3.5 rounded bg-gray-100 animate-pulse"
                            style={{
                              width: j === 0 ? "60%" : j === 5 ? "50%" : "70%",
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <p className="text-status-risk text-sm">{error}</p>
                <button
                  type="button"
                  onClick={fetchData}
                  className="text-xs text-primary underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            ) : contracts.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-text-secondary text-sm">
                No contracts match the selected filters.
              </div>
            ) : (
              <table className="w-full min-w-[820px]">
                <thead>
                  <TableHead />
                </thead>
                <tbody>
                  {contracts.map((contract, idx) => (
                    <tr
                      key={contract.id ?? idx}
                      className="border-b border-gray-100 last:border-0 hover:bg-bg-main transition-colors cursor-default"
                    >
                      {/* Project */}
                      <td className="px-6 py-5 text-sm  text-text-primary">
                        {contract.projectName ??
                          contract.project?.name ??
                          contract.name ??
                          "—"}
                      </td>

                      {/* Party */}
                      <td className="px-6 py-5 text-sm text-text-secondary">
                        {getPartyName(contract.parties)}
                      </td>

                      {/* Value */}
                      <td className="px-6 py-5 text-sm text-text-primary font-medium">
                        {formatShort(contract.contractValue)}
                      </td>

                      {/* Start */}
                      <td className="px-6 py-5 text-sm text-text-secondary">
                        {formatDate(contract.startDate)}
                      </td>

                      {/* End */}
                      <td className="px-6 py-5 text-sm text-text-secondary">
                        {formatDate(contract.endDate)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5 text-right">
                        <StatusBadge status={contract.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Table Head (shared between skeleton & data) ───────────────────────────────

function TableHead() {
  const cols = ["Project", "Party", "Value", "Start", "End", "Status"];
  return (
    <tr className="border-b border-gray-100 bg-bg-main ">
      {cols.map((col, i) => (
        <th
          key={col}
          className={`px-6 py-8 text-[12px] font-semibold text-text-secondary tracking-widest uppercase
            ${i === cols.length - 1 ? "text-right" : "text-left"}`}
        >
          {col}
        </th>
      ))}
    </tr>
  );
}

export default ContractsReport;
