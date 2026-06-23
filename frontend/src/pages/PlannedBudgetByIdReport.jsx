import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { reportService } from "../services/reportService";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import PlanChart from "../components/planning/PlanChart";
import PlanTable from "../components/planning/PlanTable";
import Spinner from "../components/common/Spinner";

/* ------------------------------------------------------------------ */
// Utilities
/* ------------------------------------------------------------------ */

function formatCompact(value) {
  const n = Number(value);
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return n.toLocaleString("en-US");
}

function capitalize(str) {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ------------------------------------------------------------------ */
// Icons
/* ------------------------------------------------------------------ */

function DollarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
// StatCard
/* ------------------------------------------------------------------ */

function StatCard({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3.5 rounded-xl bg-bg-cards1 px-4 py-4 shadow sm:px-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-mainColor text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-normal text-text-secondary">
          {label}
        </p>
        <p
          className="mt-0.5 break-words text-lg font-semibold leading-tight text-text-primary sm:text-[22px]"
          title={String(value)}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
// Main component
/* ------------------------------------------------------------------ */

export const PlannedBudgetByIdReport = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("No contract ID provided.");
      return;
    }
    setLoading(true);
    setError(null);
    reportService
      .getPlannedBudget(id)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load report.",
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleExport = async () => {
    try {
      await reportService.exportPlannedBudget(id);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="md" label="Loading report…" />
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-status-risk text-sm">{error}</p>
        {id && (
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              reportService
                .getPlannedBudget(id)
                .then(setData)
                .catch((err) =>
                  setError(
                    err?.response?.data?.message ||
                      err?.message ||
                      "Failed to load report.",
                  ),
                )
                .finally(() => setLoading(false));
            }}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  /* ── No data ── */
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-text-secondary text-sm">No plan data available.</p>
      </div>
    );
  }

  const { plan, periods = [] } = data;

  return (
    <div className="min-h-full min-w-0 bg-bg-main lg:pr-10 pr-0">
      <div className="min-w-0 space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">
              Planned Budget
            </h1>
            <p className="mt-1 text-xs text-text-secondary sm:text-sm">
              Review the contract allocation strategy and planned spend by
              period.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex w-fit items-center gap-1.5 rounded-full bg-bg-cards1 px-4 py-2 text-sm font-medium text-text-primary shadow transition-colors hover:bg-bg-main"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
          <StatCard
            icon={<DollarIcon />}
            label="Contract Value"
            value={`${formatCompact(plan?.totalAmount ?? 0)} EGP`}
          />
          <StatCard
            icon={<ActivityIcon />}
            label="Strategy"
            value={
              plan?.strategy
                ? plan.strategy
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                : "—"
            }
          />
          <StatCard
            icon={<CheckCircleIcon />}
            label="Plan Status"
            value={capitalize(plan?.status)}
          />
          <StatCard
            icon={<CalendarIcon />}
            label={"Total Periods"}
            value={periods.length > 0 ? periods.length : "—"}
          />
        </div>

        {/* ── Chart ── */}
        <div className="min-w-0 rounded-lg bg-bg-cards1 px-3 pb-8 pt-5 shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] sm:px-6 sm:pb-14 sm:pt-6">
          <PlanChart periods={periods} strategy={plan?.strategy} />
        </div>

        {/* ── Table ── */}
        <div className="min-w-0 rounded-lg bg-bg-cards1 p-4 shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] sm:p-6">
          <PlanTable
            periods={periods}
            contractValue={plan?.totalAmount ?? 0}
            currency="EGP"
            readOnly
            isConfirmed
            canPlan
            onExport={handleExport}
            isBalanced
            remaining={0}
            onChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
};