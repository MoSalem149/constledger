import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { reportService } from "../services/reportService";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import PlanChart from "../components/planning/PlanChart";
import PlanTable from "../components/planning/PlanTable";

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
// StatCard — kept custom because PlanKpis shows different fields
// (Peak Cash Period / Allocation Strategy) vs our design
// (Plan Status / Periods in {year})
/* ------------------------------------------------------------------ */

function StatCard({ icon, label, value }) {
  return (
    <div className="flex-1 bg-white rounded-xl shadow flex items-center gap-3.5 px-5 py-4">
      <div className="w-10 h-10 rounded-lg bg-bg-mainColor text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-secondary font-normal truncate">
          {label}
        </p>
        <p className="text-[22px] font-semibold text-text-primary leading-tight mt-0.5 truncate">
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get("contractId");
  const year = searchParams.get("year");

  const [data, setData] = useState({
    plan: {
      id: "6a36b8432f802d3acd8e6337",
      contractId: "6a3696e751492d02b0a30d76",
      strategy: "straight_line",
      strategyParams: {},
      totalAmount: 8750000,
      generatedAt: "2026-06-20T23:57:06.673Z",
      generatedBy: "6a23632b7be65daa24981fc4",
      status: "confirmed",
      warnings: [],
    },
    periods: [
      {
        id: "6a3728d30933d3872d81de5d",
        periodLabel: "Biweekly 1",
        periodStart: "2022-09-26T00:00:00.000Z",
        periodEnd: "2022-10-10T00:00:00.000Z",
        plannedAmount: 2187500,
        cumulativePlanned: 2187500,
        sortOrder: 0,
      },
      {
        id: "6a3728d30933d3872d81de5e",
        periodLabel: "Biweekly 2",
        periodStart: "2022-10-11T00:00:00.000Z",
        periodEnd: "2022-10-25T00:00:00.000Z",
        plannedAmount: 2187500,
        cumulativePlanned: 4375000,
        sortOrder: 1,
      },
      {
        id: "6a3728d30933d3872d81de5f",
        periodLabel: "Biweekly 3",
        periodStart: "2022-10-26T00:00:00.000Z",
        periodEnd: "2022-11-09T00:00:00.000Z",
        plannedAmount: 2187500,
        cumulativePlanned: 6562500,
        sortOrder: 2,
      },
      {
        id: "6a3728d30933d3872d81de60",
        periodLabel: "Biweekly 4",
        periodStart: "2022-11-10T00:00:00.000Z",
        periodEnd: "2022-11-25T00:00:00.000Z",
        plannedAmount: 2187500,
        cumulativePlanned: 8750000,
        sortOrder: 3,
      },
    ],
    kpis: {
      peakCash: 8750000,
      burnRate: 4439166.67,
    },
    warnings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  //   useEffect(() => {
  //     if (!contractId) {
  //       setLoading(false);
  //       return;
  //     }
  //     setLoading(true);
  //     reportService
  //       .getPlannedBudget({ contractId, year })
  //       .then(setData)
  //       .catch(setError)
  //       .finally(() => setLoading(false));
  //   }, [contractId, year]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportService.exportPlannedBudget({ contractId, year });
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  //   /* ── Loading ── */
  //   if (loading) {
  //     return (
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <p className="text-text-secondary text-sm">Loading report…</p>
  //       </div>
  //     );
  //   }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-status-risk text-sm">Failed to load report.</p>
      </div>
    );
  }

  if (!data) return null;

  const { contract, plan, year: dataYear, periodCount, periods = [] } = data;

  return (
    <div>
      <div className="px-6 py-6 space-y-5 bg-bg-main min-h-screen">
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              Planned Budget
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {contract?.name ?? "—"}&nbsp;.&nbsp;Year {dataYear}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mt-0.5"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="flex gap-4">
          <StatCard
            icon={<DollarIcon />}
            label="Contracts Value"
            value={`${formatCompact(+contract?.contractValue)} EGP`}
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
            label={`Periods in ${dataYear}`}
            value={periodCount ?? "—"}
          />
        </div>

        {/* ── Chart — reusing PlanChart ── */}
        <div className="bg-bg-cards1 rounded-lg shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] px-6 pt-6 pb-14">
          <PlanChart periods={periods} strategy={plan?.strategy} />
        </div>

        {/* ── Table — reusing PlanTable ── */}
        <div className="bg-bg-cards1 rounded-lg shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] p-6">
          <PlanTable
            periods={periods}
            contractValue={contract?.contractValue ?? 0}
            currency={contract?.currency ?? "EGP"}
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
