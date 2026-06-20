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
  if (!str || !str.trim()) return null;
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
  const parts = str.trim().split(" ");
  if (parts.length < 3) return null;
  const [d, m, y] = parts;
  const month = M[m];
  if (month === undefined || isNaN(+d) || isNaN(+y)) return null;
  return new Date(+y, month, +d);
};

const toPct = (dateStr, startStr, endStr) => {
  const d = parseDate(dateStr),
    s = parseDate(startStr),
    e = parseDate(endStr);
  if (!d || !s || !e || e - s === 0) return null;
  return Math.min(96, Math.max(4, ((d - s) / (e - s)) * 100));
};
// =================== TIMELINE PREVIEW ===================
const TimelinePreview = ({ milestones, startDate, endDate }) => {
  const toDate = (str) => {
    if (!str || str === "null") return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const scaleStart = toDate(startDate);
  const scaleEnd = toDate(endDate);

  const validMilestones = (milestones ?? []).filter(
    (m) => toDate(m.dueDate) !== null,
  );

  const formatLabel = (d) =>
    d?.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) ?? "";

  const toPct = (dateStr) => {
    const d = toDate(dateStr);
    if (!d || !scaleStart || !scaleEnd || scaleStart >= scaleEnd) return null;
    const pct = ((d - scaleStart) / (scaleEnd - scaleStart)) * 94 + 3;
    return Math.max(3, Math.min(97, pct));
  };

  if (!scaleStart || !scaleEnd) {
    return (
      <div>
        <h2 className="text-[17px] font-medium text-text-primary mb-3">
          Timeline Preview
        </h2>
        <p className="text-xs text-text-secondary text-center">
          No date range available
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[17px] font-medium text-text-primary mb-3">
        Timeline Preview
      </h2>

      <div className="flex justify-between text-xs text-text-secondary mb-1 px-1">
        <span>{formatLabel(scaleStart)}</span>
        <span>{formatLabel(scaleEnd)}</span>
      </div>

      <div
        className="relative bg-bg-main border border-gray-100 rounded-lg"
        style={{ height: 96 }}
      >
        <div
          className="absolute h-0.5 bg-gray-300 rounded-full"
          style={{ top: 28, left: "3%", right: "3%" }}
        />

        {validMilestones.length === 0 && (
          <p className="text-xs text-text-secondary text-center leading-[96px]">
            No milestones available
          </p>
        )}

        {validMilestones.map((m, i) => {
          const pct = toPct(m.dueDate);
          if (pct === null) return null;
          return (
            <div
              key={m.id ?? i}
              className="absolute flex flex-col items-center"
              style={{ left: `${pct}%`, transform: "translateX(-50%)", top: 0 }}
            >
              <div className="w-3.5 h-3.5 bg-primary rotate-45 mt-[21px] flex-shrink-0" />
              <span className="text-[10px] font-medium text-text-secondary mt-[8px] whitespace-nowrap max-w-[100px] overflow-hidden text-ellipsis text-center">
                {m.name || `M${i + 1}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =================== DATE FIELDS ===================
const DateFields = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  readOnly,
}) => {
  return (
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
            value={formatDate(value)}
            onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
            readOnly={readOnly}
            className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px]
              text-text-primary bg-bg-cards1 outline-none transition-colors ${
                readOnly ? "cursor-default" : "focus:border-primary"
              }`}
          />
        </div>
      ))}
    </div>
  );
};

// =================== MILESTONE ROW ===================
const MilestoneRow = ({ milestone, onRemove, onChange, readOnly }) => {
  const [local, setLocal] = useState({
    name: milestone.name,
    dueDate: milestone.dueDate,
  });

  return (
    <div
      className={`grid ${readOnly ? "grid-cols-[1fr_160px_100px]" : "grid-cols-[1fr_160px_100px_44px]"} px-4 py-4 items-center border-b border-gray-100`}
    >
      <input
        value={local.name}
        onChange={
          readOnly
            ? undefined
            : (e) => setLocal((p) => ({ ...p, name: e.target.value }))
        }
        onBlur={readOnly ? undefined : () => onChange({ ...local })}
        readOnly={readOnly}
        className={`text-[13.5px] text-text-primary bg-transparent border-b border-transparent
          outline-none w-full transition-colors ${readOnly ? "cursor-default" : "focus:border-gray-300"}`}
      />
      <input
        value={local.dueDate}
        onChange={
          readOnly
            ? undefined
            : (e) => setLocal((p) => ({ ...p, dueDate: e.target.value }))
        }
        onBlur={readOnly ? undefined : () => onChange({ ...local })}
        readOnly={readOnly}
        className={`text-[13.5px] text-text-primary font-medium bg-transparent border-b border-transparent
          outline-none w-full transition-colors ${readOnly ? "cursor-default" : "focus:border-gray-300"}`}
      />
      <span className="text-[13.5px] text-text-secondary">
        {milestone.source}
      </span>
      {!readOnly && (
        <button
          onClick={onRemove}
          className="flex justify-center text-text-secondary hover:text-status-risk transition-colors"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
};

// =================== MILESTONES TABLE ===================
const MilestonesTable = ({ milestones, onRemove, onChange, readOnly }) => (
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
      {!readOnly && (
        <button
          onClick={() => onChange("add")}
          className="flex items-center gap-1.5 px-3.5 py-2 shadow rounded-full
            text-[13px] text-text-primary bg-bg-cards1 hover:bg-gray-100 transition-colors
            self-start whitespace-nowrap"
        >
          <PlusIcon /> Add Milestone
        </button>
      )}
    </div>

    <div className="overflow-x-auto">
      <div className="min-w-[460px] shadow rounded overflow-hidden">
        <div
          className={`grid ${readOnly ? "grid-cols-[1fr_160px_100px]" : "grid-cols-[1fr_160px_100px_44px]"} bg-gray-100 px-4 py-4`}
        >
          <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
            REPORTING PERIOD
          </span>
          <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
            Due Time
          </span>
          <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
            Source
          </span>
          {!readOnly && <span />}
        </div>
        {milestones.map((m) => (
          <MilestoneRow
            key={m.id}
            milestone={m}
            onRemove={() => onRemove(m.id)}
            onChange={(fields) => onChange("update", m.id, fields)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  </div>
);

// =================== EXPORT ===================
const ScheduleMilestonesSection = ({ data, readOnly }) => {
  const { changeData } = useContext(ContractContext);

  const [startDate, setStartDate] = useState(data.start_date ?? "");
  const [endDate, setEndDate] = useState(data.end_date ?? "");

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
    } else {
      return;
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
        onStartChange={(val) => {
          setStartDate(val);
          changeData({ start_date: val });
        }}
        onEndChange={(val) => {
          setEndDate(val);
          changeData({ end_date: val });
        }}
        readOnly={readOnly}
      />
      <MilestonesTable
        milestones={milestones}
        onRemove={handleRemove}
        onChange={handleMilestones}
        readOnly={readOnly}
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
