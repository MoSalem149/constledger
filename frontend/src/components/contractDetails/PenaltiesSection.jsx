import { useState } from "react";

// =================== ICONS ===================
const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const PlusIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// =================== SHARED ===================
const Dot = ({ status }) => {
  const cls = {
    green: "bg-status-track",
    orange: "bg-watch-2",
    red: "bg-status-risk",
  };
  return (
    <div
      className={`w-2 h-2 rounded-full flex-shrink-0 ${cls[status] ?? "bg-gray-200"}`}
    />
  );
};

// =================== CLAUSE CARD ===================
const ClauseCard = ({ status, condition, formula, onRemove }) => (
  <div
    className={`border border-gray-100 rounded-lg overflow-hidden bg-bg-main
      `}
  >
    <div className="relative p-4 pr-12">
      {/* Trash */}
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 text-text-secondary hover:text-status-risk transition-colors"
      >
        <TrashIcon />
      </button>

      {/* CONDITION row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8 gap-1 mb-3">
        <div className="flex items-center gap-2 sm:w-44 flex-shrink-0">
          <span className="text-[10.5px] font-semibold text-text-secondary tracking-widest uppercase">
            Condition
          </span>
        </div>
        <span className="text-[13.5px] text-text-primary pl-4 sm:pl-0">
          {condition}
        </span>
      </div>

      {/* PENALTY / FORMULA row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8 gap-1">
        <div className="sm:w-44 flex-shrink-0 pl-4 sm:pl-0">
          <span className="text-[10.5px] font-semibold text-text-secondary tracking-widest uppercase">
            Penalty / Formula
          </span>
        </div>
        <span className="text-[13.5px] text-text-secondary pl-4 sm:pl-0">
          {formula}
        </span>
      </div>
    </div>
  </div>
);

// =================== DATA ===================
const CLAUSES_INIT = [
  {
    id: 1,
    status: "green",
    condition: "Delay beyond final completion date",
    formula: "0.1% of contract value per calendar day, capped at 10%",
    warning: null,
  },
  {
    id: 2,
    status: "green",
    condition: "Failure to mobilize within 14 days of NTP",
    formula: "50,000 EGP/day flat penalty",
    warning: null,
  },
  {
    id: 3,
    status: "orange",
    condition: "Non-conforming earthworks compaction (<95% MDD)",
    formula: "Reject and re-execute at contractor's cost",
    warning: `Compaction threshold "95% MDD" was inferred from a footnote. Verify against §8.3.`,
  },
];

// =================== EXPORT ===================
const PenaltiesSection = () => {
  const [clauses, setClauses] = useState(CLAUSES_INIT);

  return (
    <div className="bg-bg-cards1 p-4 shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[17px] font-medium text-text-primary">
            Penalty Clauses
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {clauses.length} clauses extracted from §8 Liabilities &amp; Damages
          </p>
        </div>
        <button
          onClick={() => {}}
          className="flex items-center gap-1.5 px-3.5 py-2 shadow rounded-full
            text-[13px] text-text-primary bg-bg-cards1 hover:bg-gray-100 transition-colors
            self-start whitespace-nowrap"
        >
          <PlusIcon /> Add Clause
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 ">
        {clauses.map((c) => (
          <ClauseCard
            key={c.id}
            {...c}
            onRemove={() => setClauses((p) => p.filter((x) => x.id !== c.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default PenaltiesSection;
