import { useState } from "react";
import { TrashIcon } from "../icons/TrashIcon";
import { PlusIcon } from "../icons/PlusIcon";

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

// =================== DATE FIELDS ===================
const DateFields = ({ startDate, endDate, onStartChange, onEndChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
    {[
      { label: "Start Date", value: startDate, onChange: onStartChange },
      { label: "End Date", value: endDate, onChange: onEndChange },
    ].map(({ label, value, onChange }) => (
      <div key={label}>
        <div className="flex items-center gap-2 mb-2">
          <Dot status="green" />
          <span className="text-[13px] text-text-secondary">{label}</span>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px]
            text-text-primary bg-bg-cards1 outline-none focus:border-primary transition-colors"
        />
      </div>
    ))}
  </div>
);

// =================== MILESTONES TABLE ===================
const MILESTONES_INIT = [
  {
    id: 1,
    name: "Mobilization complete",
    dueDate: "24 May 2026",
    source: "§3.1",
    status: "green",
  },
  {
    id: 2,
    name: "Site clearance - Zones A & B",
    dueDate: "20 Jun 2026",
    source: "§4.1",
    status: "green",
  },
  {
    id: 3,
    name: "Earthworks 50% complete",
    dueDate: "25 Jul 2026",
    source: "§4.2",
    status: "orange",
  },
  {
    id: 4,
    name: "Internal roads handover",
    dueDate: "05 Sept 2026",
    source: "§6.1",
    status: "green",
  },
  {
    id: 5,
    name: "Drainage system test",
    dueDate: "28 Sept 2026",
    source: "§4.2",
    status: "orange",
  },
  {
    id: 6,
    name: "Final taking over",
    dueDate: "15 Oct 2026",
    source: "§8.1",
    status: "green",
  },
];

const MilestonesTable = ({ milestones, onRemove }) => (
  <div className="mb-8">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
      <div>
        <h2 className="text-[17px] font-medium text-text-primary">
          Milestones
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          {milestones.length} milestones extracted. 1 inferred from §4.2
          timeline narrative
        </p>
      </div>
      <button
        className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg
        text-[13px] text-text-primary bg-bg-cards1 hover:bg-gray-100 transition-colors
        self-start whitespace-nowrap"
      >
        <PlusIcon /> Add Milestone
      </button>
    </div>

    <div className="overflow-x-auto">
      <div className="min-w-[460px] shadow rounded overflow-hidden">
        {/* Head */}
        <div className="grid grid-cols-[1fr_160px_100px_44px] bg-gray-100 px-4 py-4">
          <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
            Name
          </span>
          <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
            Due Time
          </span>
          <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
            Source
          </span>
          <span />
        </div>
        {/* Rows */}
        {milestones.map((m) => (
          <div
            key={m.id}
            className={`grid grid-cols-[1fr_160px_100px_44px] px-4 py-4 items-center
              border-b border-gray-100 transition-colors
              `}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[13.5px] text-text-primary truncate">
                {m.name}
              </span>
            </div>
            <span className="text-[13.5px] text-text-primary font-medium">
              {m.dueDate}
            </span>
            <span className="text-[13.5px] text-text-secondary">
              {m.source}
            </span>
            <button
              onClick={() => onRemove(m.id)}
              className="flex justify-center text-text-secondary hover:text-status-risk transition-colors"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// =================== TIMELINE PREVIEW ===================
// Parse "DD Mon YYYY" safely across all browsers
const parseDate = (str) => {
  const M = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Sept: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const [d, m, y] = str.split(" ");
  return new Date(+y, M[m], +d);
};

// Returns 3-97% so edge diamonds are never clipped
const toPct = (dateStr, startStr, endStr) => {
  const d = parseDate(dateStr),
    s = parseDate(startStr),
    e = parseDate(endStr);
  return Math.min(97, Math.max(3, ((d - s) / (e - s)) * 100));
};

const TimelinePreview = ({ milestones, startDate, endDate }) => (
  <div>
    <h2 className="text-[17px] font-medium text-text-primary mb-3">
      Timeline Preview
    </h2>

    {/* Date labels */}
    <div className="flex justify-between text-xs text-text-secondary mb-1 px-1">
      <span>{startDate}</span>
      <span>{endDate}</span>
    </div>

    {/* Track + diamonds */}
    <div
      className="relative bg-bg-main border border-gray-100 rounded-lg"
      style={{ height: 58 }}
    >
      {/* Horizontal track */}
      <div
        className="absolute left-0 right-0 h-0.5 bg-bg-main rounded-full"
        style={{ top: 20 }}
      />

      {milestones.map((m, i) => {
        const pct = toPct(m.dueDate, startDate, endDate);
        return (
          <div
            key={m.id}
            className="absolute flex flex-col items-center"
            style={{ left: `${pct}%`, transform: "translateX(-50%)", top: 0 }}
          >
            {/* Diamond = rotated square, centered on the track (top 20px, half of 14px = 7px → mt-[13px]) */}
            <div className="w-3.5 h-3.5 bg-primary rotate-45 mt-[13px]" />
            {/* Label */}
            <span className="text-[10px] font-medium text-text-secondary mt-[10px] whitespace-nowrap">
              M{i + 1}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// =================== EXPORT ===================
const ScheduleMilestonesSection = () => {
  const [startDate, setStartDate] = useState("10 May 2026");
  const [endDate, setEndDate] = useState("15 Oct 2026");
  const [milestones, setMilestones] = useState(MILESTONES_INIT);

  return (
    <div className="bg-bg-cards1 p-4 shadow rounded">
      <DateFields
        startDate={startDate}
        endDate={endDate}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
      />
      <MilestonesTable
        milestones={milestones}
        onRemove={(id) => setMilestones((p) => p.filter((m) => m.id !== id))}
      />
      <TimelinePreview
        milestones={milestones}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};

export default ScheduleMilestonesSection;
