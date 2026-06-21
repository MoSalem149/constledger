import React, { useState, useEffect } from "react";
import { reportService } from "../services/reportService";
import ProjectImage from "../assets/projectImage.png";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import { Link } from "react-router-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(val, currency = "EGP") {
  if (val == null) return "—";
  if (val >= 1_000_000_000)
    return `${(val / 1_000_000_000).toFixed(1)}B ${currency}`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M ${currency}`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K ${currency}`;
  return `${val.toLocaleString("en-EG")} ${currency}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPartyName(parties = []) {
  const main = parties.find((p) => p.role === "main_contractor");
  return main?.name || parties[0]?.name || "—";
}

/** Short ID badge — last 8 chars of id, uppercased */
function shortId(id = "") {
  return id.slice(-8).toUpperCase();
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

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

const IconArrowRight = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ─── Stat cell ─────────────────────────────────────────────────────────────────

function StatCell({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-text-secondary">{label}</span>
      <span className="text-[14px] text-text-primary">{value}</span>
    </div>
  );
}

// ─── Contract Row ──────────────────────────────────────────────────────────────

function ContractRow({ contract }) {
  return (
    <div className="bg-white rounded overflow-hidden shadow flex min-h-[150px]">
      {/* ── Image ── */}
      <div className="relative w-[160px] flex-shrink-0 bg-gray-100">
        <img
          src={ProjectImage}
          alt={contract.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/25" />
        <span className="absolute top-2 left-2 bg-black/50 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
          {shortId(contract.id)}
        </span>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-6 py-5 flex flex-col justify-between">
        {/* Name + party */}
        <div>
          <h3 className="text-[15px] font-semibold text-text-primary leading-snug">
            {contract.name}
          </h3>
          <p className="text-[13px] text-text-secondary mt-0.5">
            {getPartyName(contract.parties)}
          </p>
        </div>

        {/* Stats + action */}
        <div className="flex items-end justify-between mt-4">
          <div className="flex items-start gap-40">
            <StatCell
              label="Budget"
              value={formatValue(contract.contractValue, contract.currency)}
            />
            <StatCell
              label="Start Date"
              value={formatDate(contract.startDate)}
            />
            <StatCell label="End Date" value={formatDate(contract.endDate)} />
          </div>

          {/* Open Report */}
        </div>
      </div>
      <Link
        to={`/reports/planned-budget/${contract.id}`}
        className="flex bg-bg-main w-40 justify-center items-end p-2"
      >
        <div
          className="flex justify-center items-center gap-1.5 text-primary text-[13px] font-semibold
             transition-all duration-150 group"
        >
          Open Report
          <IconArrowRight />
        </div>
      </Link>
    </div>
  );
}

// ─── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow flex min-h-[150px] animate-pulse">
      <div className="w-[160px] flex-shrink-0 bg-gray-100" />
      <div className="flex-1 px-6 py-5 flex flex-col justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-2/3 rounded bg-gray-100" />
          <div className="h-3 w-1/4 rounded bg-gray-100" />
        </div>
        <div className="flex gap-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="h-2.5 w-16 rounded bg-gray-100" />
              <div className="h-4 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const PlannedBudgetReport = ({ onBack, onOpenReport }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    reportService
      .getContracts()
      .then(setData)
      .catch(() => setError("Failed to load contracts. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const contracts = data?.contracts ?? [];

  const activeContracts = contracts.filter((c) => c.status === "active");

  return (
    <div className="min-h-screen bg-bg-main">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-text-primary tracking-tight">
            Planned Budget
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Choose the project to review its report
          </p>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full shadow
              bg-white text-text-primary text-sm font-medium hover:bg-bg-main transition-colors"
        >
          <ArrowLeftIcon />
          Back
        </button>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-status-risk text-sm">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              reportService
                .getContracts()
                .then(setData)
                .catch(() =>
                  setError("Failed to load contracts. Please try again."),
                )
                .finally(() => setLoading(false));
            }}
            className="text-xs text-primary underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      ) : activeContracts.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-text-secondary text-sm">No contracts found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activeContracts.map((contract) => (
            <ContractRow
              key={contract.id}
              contract={contract}
              onOpenReport={onOpenReport}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlannedBudgetReport;
