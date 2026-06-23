import { useState, useContext, useEffect } from "react";
import { ContractContext } from "../../context/EditContaractContext";
import { TrashIcon } from "../icons/TrashIcon";
import { PlusIcon } from "../icons/PlusIcon";
import { formatDate } from "../../utils/formatDate";
import { computeEndDateFromDuration, computeDurationFromDates } from "../../utils/contractDates";

const MILESTONE_NAME_MAX = 200;
const DATE_INPUT_MAX = 24;

const isValidDate = (value) => {
  if (!value) return true;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

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
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Sept: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const parts = str.trim().split(" ");
  if (parts.length < 3) return null;
  const [d, m, y] = parts;
  const month = M[m];
  if (month === undefined || isNaN(+d) || isNaN(+y)) return null;
  return new Date(+y, month, +d);
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
    d?.toLocaleDateString("en-US", {
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

      <div className="flex justify-between gap-4 px-1 text-[10px] text-text-secondary sm:text-xs">
        <span>{formatLabel(scaleStart)}</span>
        <span className="text-right">{formatLabel(scaleEnd)}</span>
      </div>

      {/* Fixed height container — no overflow, no scrollbar */}
      <div className="relative bg-bg-main border border-gray-100 rounded-lg h-16">
        {/* Horizontal track line */}
        <div
          className="absolute h-0.5 bg-gray-300 rounded-full"
          style={{ top: 28, left: "3%", right: "3%" }}
        />

        {validMilestones.length === 0 && (
          <p className="text-xs text-text-secondary text-center leading-[64px]">
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
              <span className="text-[10px] font-medium text-text-secondary mt-[8px] whitespace-nowrap">
                {`M${i + 1}`}
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
  endDateHint,
  readOnly,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      {[
        { label: "Start Date", value: startDate, onChange: onStartChange },
        { label: "End Date", value: endDate, onChange: onEndChange },
      ].map(({ label, value, onChange }) => {
        const valid = isValidDate(value);
        const isEnd = label === "End Date";
        return (
          <div key={label}>
            <div className="flex items-center gap-2 mb-2">
              <Dot status="green" />
              <span className="text-[13px] text-text-secondary">{label}</span>
            </div>
            <input
              type="text"
              maxLength={DATE_INPUT_MAX}
              aria-label={label}
              aria-invalid={!valid}
              value={formatDate(value)}
              onChange={
                readOnly
                  ? undefined
                  : (e) => onChange(e.target.value.slice(0, DATE_INPUT_MAX))
              }
              readOnly={readOnly}
              placeholder="e.g. 1 Jan 2026"
              className={`w-full px-4 py-3 border rounded-lg text-[14px]
                text-text-primary bg-bg-cards1 outline-none transition-colors ${
                  !valid ? "border-status-risk" : "border-gray-200"
                } ${readOnly ? "cursor-default" : "focus:border-primary"}`}
            />
            {!valid && (
              <p className="mt-1 text-[11px] text-status-risk">
                Enter a valid date
              </p>
            )}
            {isEnd && endDateHint && valid && (
              <p
                className={`mt-1 text-[11px] ${
                  endDateHint.startsWith("Duration updated")
                    ? "text-status-track"
                    : "text-text-secondary"
                }`}
              >
                {endDateHint}
              </p>
            )}
          </div>
        );
      })}
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
      className={`grid grid-cols-1 gap-3 rounded-lg border border-border bg-bg-main p-3 md:items-center md:gap-0 md:rounded-none md:border-x-0 md:border-b md:border-t-0 md:border-gray-100 md:bg-transparent md:px-4 md:py-4 ${readOnly
        ? "md:grid-cols-[minmax(0,1fr)_160px]"
        : "md:grid-cols-[minmax(0,1fr)_160px_44px]"
        }`}
    >
      <label>
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-secondary md:hidden">
          Milestone
        </span>
        <input
          type="text"
          maxLength={MILESTONE_NAME_MAX}
          aria-label="Milestone name"
          value={local.name}
          onChange={
            readOnly
              ? undefined
              : (e) =>
                  setLocal((p) => ({
                    ...p,
                    name: e.target.value.slice(0, MILESTONE_NAME_MAX),
                  }))
          }
          onBlur={readOnly ? undefined : () => onChange({ ...local })}
          readOnly={readOnly}
          className={`w-full rounded-lg border border-border bg-bg-cards1 px-3 py-2 text-[13.5px] text-text-primary outline-none transition-colors md:rounded-none md:border-transparent md:bg-transparent md:px-0 md:py-0 ${readOnly
            ? "cursor-default"
            : "focus:border-primary md:focus:border-gray-300"
            }`}
        />
      </label>
      <label>
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-secondary md:hidden">
          Due Date
        </span>
        <input
          type="text"
          maxLength={DATE_INPUT_MAX}
          aria-label="Milestone due date"
          aria-invalid={!isValidDate(local.dueDate)}
          value={local.dueDate}
          onChange={
            readOnly
              ? undefined
              : (e) =>
                  setLocal((p) => ({
                    ...p,
                    dueDate: e.target.value.slice(0, DATE_INPUT_MAX),
                  }))
          }
          onBlur={readOnly ? undefined : () => onChange({ ...local })}
          readOnly={readOnly}
          placeholder="e.g. 1 Jan 2026"
          className={`w-full rounded-lg border bg-bg-cards1 px-3 py-2 text-[13.5px] font-medium text-text-primary outline-none transition-colors md:rounded-none md:border-transparent md:bg-transparent md:px-0 md:py-0 ${
            !isValidDate(local.dueDate) ? "border-status-risk" : "border-border"
          } ${readOnly ? "cursor-default" : "focus:border-primary md:focus:border-gray-300"}`}
        />
      </label>

      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove milestone"
          className="flex justify-end text-text-secondary transition-colors hover:text-status-risk md:justify-center"
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
          type="button"
          onClick={() => onChange("add")}
          className="flex w-full items-center justify-center gap-1.5 px-3.5 py-2 shadow rounded-full
            text-[13px] text-text-primary bg-bg-cards1 hover:bg-gray-100 transition-colors
            self-start whitespace-nowrap sm:w-auto"
        >
          <PlusIcon /> Add Milestone
        </button>
      )}
    </div>

    <div>
      <div className="flex flex-col gap-3 overflow-hidden rounded md:block md:shadow">
        <div
          className={`hidden bg-gray-100 px-4 py-4 md:grid ${readOnly
            ? "md:grid-cols-[minmax(0,1fr)_160px]"
            : "md:grid-cols-[minmax(0,1fr)_160px_44px]"
            }`}
        >
          <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
            REPORTING PERIOD
          </span>
          <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
            Due Time
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
  const [endDateHint, setEndDateHint] = useState(null);

  const [milestones, setMilestones] = useState(
    (data.milestones ?? []).map((m, i) => ({
      id: i + 1,
      source: "—",
      status: "green",
      ...m,
      dueDate: formatDate(m.dueDate),
    })),
  );

  useEffect(() => {
    setStartDate(data.start_date ?? "");
    setEndDate(data.end_date ?? "");
  }, [data.start_date, data.end_date]);

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
    <div className="min-w-0 rounded-lg bg-bg-cards1 p-4 shadow sm:p-5">
      <DateFields
        startDate={startDate}
        endDate={endDate}
        onStartChange={(val) => {
          setStartDate(val);
          const updates = { start_date: val };
          const days = Number(data.duration_days);
          if (val && Number.isInteger(days) && days >= 1) {
            const computedEnd = computeEndDateFromDuration(val, days);
            if (computedEnd) {
              updates.end_date = computedEnd;
              setEndDate(computedEnd);
            }
          }
          changeData(updates);
        }}
        onEndChange={(val) => {
          setEndDate(val);
          setEndDateHint(null);

          const updates = { end_date: val };
          const start = startDate || data.start_date;

          if (!start) {
            changeData(updates);
            setEndDateHint(
              "Add a start date to auto-update the duration.",
            );
            return;
          }

          const computedDays = computeDurationFromDates(start, val);
          if (computedDays == null) {
            changeData(updates);
            if (val.trim()) {
              setEndDateHint("End date must be after the start date.");
            }
            return;
          }

          updates.duration_days = computedDays;
          changeData(updates);
          setEndDateHint(`Duration updated to ${computedDays} days.`);
        }}
        endDateHint={endDateHint}
        readOnly={readOnly}
      />
      <MilestonesTable
        milestones={milestones}
        onRemove={handleRemove}
        onChange={handleMilestones}
        readOnly={readOnly}
      />
      {/* No overflow wrapper — timeline uses a fixed-height container */}
      <TimelinePreview
        milestones={milestones}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};

export default ScheduleMilestonesSection;