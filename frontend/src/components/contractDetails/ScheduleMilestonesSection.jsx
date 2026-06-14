import { useState, useContext } from "react";
import { ContractContext } from "../../context/EditContaractContext";
import { TrashIcon } from "../icons/TrashIcon";
import { PlusIcon } from "../icons/PlusIcon";
import { formatDate } from "../../utils/formatDate";

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
    <div className="flex justify-between text-xs text-text-secondary mb-1 px-1">
      <span>{startDate}</span>
      <span>{endDate}</span>
    </div>
    <div
      className="relative bg-bg-main border border-gray-100 rounded-lg"
      style={{ height: 58 }}
    >
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
            <div className="w-3.5 h-3.5 bg-primary rotate-45 mt-[13px]" />
            <span className="text-[10px] font-medium text-text-secondary mt-[10px] whitespace-nowrap">
              M{i + 1}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// =================== DATE FIELDS ===================
const DateFields = ({ startDate, endDate, onStartBlur, onEndBlur }) => {
  const [local, setLocal] = useState({ start: startDate, end: endDate });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      {[
        { label: "Start Date", field: "start", onBlur: onStartBlur },
        { label: "End Date", field: "end", onBlur: onEndBlur },
      ].map(({ label, field, onBlur }) => (
        <div key={label}>
          <div className="flex items-center gap-2 mb-2">
            <Dot status="green" />
            <span className="text-[13px] text-text-secondary">{label}</span>
          </div>
          <input
            type="text"
            value={local[field]}
            onChange={(e) =>
              setLocal((p) => ({ ...p, [field]: e.target.value }))
            }
            onBlur={() => onBlur(local[field])}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px]
              text-text-primary bg-bg-cards1 outline-none focus:border-primary transition-colors"
          />
        </div>
      ))}
    </div>
  );
};

// =================== MILESTONE ROW (editable) ===================
const MilestoneRow = ({ milestone, onRemove, onChange }) => {
  const [local, setLocal] = useState({
    name: milestone.name,
    dueDate: milestone.dueDate,
  });

  return (
    <div className="grid grid-cols-[1fr_160px_100px_44px] px-4 py-4 items-center border-b border-gray-100">
      <input
        value={local.name}
        onChange={(e) => setLocal((p) => ({ ...p, name: e.target.value }))}
        onBlur={() => onChange({ ...local })}
        className="text-[13.5px] text-text-primary bg-transparent border-b border-transparent
          focus:border-gray-300 outline-none w-full transition-colors"
      />
      <input
        value={local.dueDate}
        onChange={(e) => setLocal((p) => ({ ...p, dueDate: e.target.value }))}
        onBlur={() => onChange({ ...local })}
        className="text-[13.5px] text-text-primary font-medium bg-transparent border-b border-transparent
          focus:border-gray-300 outline-none w-full transition-colors"
      />
      <span className="text-[13.5px] text-text-secondary">
        {milestone.source}
      </span>
      <button
        onClick={onRemove}
        className="flex justify-center text-text-secondary hover:text-status-risk transition-colors"
      >
        <TrashIcon />
      </button>
    </div>
  );
};

const MilestonesTable = ({ milestones, onRemove, onChange }) => (
  <div className="mb-8">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
      <div>
        <h2 className="text-[17px] font-medium text-text-primary">
          Milestones
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          {milestones.length} milestones
        </p>
      </div>
      <button
        onClick={() => onChange("add")}
        className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg
          text-[13px] text-text-primary bg-bg-cards1 hover:bg-gray-100 transition-colors
          self-start whitespace-nowrap"
      >
        <PlusIcon /> Add Milestone
      </button>
    </div>

    <div className="overflow-x-auto">
      <div className="min-w-[460px] shadow rounded overflow-hidden">
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
        {milestones.map((m) => (
          <MilestoneRow
            key={m.id}
            milestone={m}
            onRemove={() => onRemove(m.id)}
            onChange={(fields) => onChange("update", m.id, fields)}
          />
        ))}
      </div>
    </div>
  </div>
);

// =================== EXPORT ===================
const ScheduleMilestonesSection = ({ data }) => {
  const { changeData } = useContext(ContractContext);

  const [startDate, setStartDate] = useState(data.start_date ?? "10 May 2026");
  const [endDate, setEndDate] = useState(data.end_date ?? "15 Oct 2026");
  const [milestones, setMilestones] = useState(
    (data.milestones ?? []).map((m, i) => ({
      id: i + 1,
      source: "—",
      status: "green",
      ...m,
      dueDate: formatDate(m.dueDate),
    })),
  );

  const syncMilestones = (updated) => {
    changeData({
      milestones: updated.map(({ id, source, status, ...rest }) => rest),
    });
  };

  const handleMilestones = (action, id, fields) => {
    let updated;
    if (action === "add") {
      updated = [
        ...milestones,
        { id: Date.now(), name: "", dueDate: "", source: "—", status: "green" },
      ];
    } else if (action === "update") {
      updated = milestones.map((m) => (m.id === id ? { ...m, ...fields } : m));
    }
    setMilestones(updated);
    syncMilestones(updated);
  };

  const handleRemove = (id) => {
    const updated = milestones.filter((m) => m.id !== id);
    setMilestones(updated);
    syncMilestones(updated);
  };

  return (
    <div className="bg-bg-cards1 p-4 shadow rounded">
      <DateFields
        startDate={startDate}
        endDate={endDate}
        onStartBlur={(val) => {
          setStartDate(val);
          changeData({ start_date: val });
        }}
        onEndBlur={(val) => {
          setEndDate(val);
          changeData({ end_date: val });
        }}
      />
      <MilestonesTable
        milestones={milestones}
        onRemove={handleRemove}
        onChange={handleMilestones}
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
