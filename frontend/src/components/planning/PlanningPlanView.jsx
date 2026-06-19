import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import RegenerateIcon from "../icons/RegenerateIcon";
import { formatEGP } from "../../utils/format";
import PlanChart from "./PlanChart";
import PlanTable from "./PlanTable";
import PlanKpis from "./PlanKpis";
import FallbackNotice from "./FallbackNotice";

export default function PlanningPlanView({
  contractData,
  planData,
  status,
  canPlan,
  onUpdate,
  onConfirm,
  onRegenerate,
  onExport,
}) {
  const { plan, periods = [], kpis = {}, warnings = [] } = planData || {};
  const [localPeriods, setLocalPeriods] = useState(periods);
  const [confirming, setConfirming] = useState(false);

  // keep local periods in sync when new planData arrives
  useState(() => {
    setLocalPeriods(periods);
  }); // intentional: will sync on re-render via useEffect below

  useMemo(() => {
    setLocalPeriods(periods);
  }, [periods]);

  const contractValue = contractData?.contract_value || 0;
  const currency = contractData?.currency || "EGP";

  const totalPlanned = useMemo(
    () =>
      localPeriods.reduce((sum, p) => sum + (Number(p.plannedAmount) || 0), 0),
    [localPeriods],
  );

  const remaining = contractValue - totalPlanned;
  const isBalanced = Math.abs(remaining) <= 0.01;

  const handlePeriodChange = useCallback((index, newAmount) => {
    setLocalPeriods((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], plannedAmount: Number(newAmount) || 0 };
      // recompute cumulative
      let cum = 0;
      for (let i = 0; i < next.length; i++) {
        cum += Number(next[i].plannedAmount) || 0;
        next[i] = { ...next[i], cumulativePlanned: cum };
      }
      return next;
    });
  }, []);

  const handleConfirm = async () => {
    if (!isBalanced) return;
    setConfirming(true);
    try {
      // Save current edits first, then confirm
      const payload = localPeriods.map((p) => ({
        periodLabel: p.periodLabel,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        plannedAmount: p.plannedAmount,
        sortOrder: p.sortOrder,
      }));
      await onUpdate(payload);
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  const isConfirmed = status === "confirmed";

  return (
    <div className="font-sans space-y-6">
      {/* Header */}
      <div className=" flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-normal text-text-placeholder tracking-widest mb-4">
            {contractData?.contractNumber} · FINANCE
          </p>
          <h2 className="text-lg font-medium text-text-primary mb-4">
            Project Plan
          </h2>
          <p className="text-sm text-text-secondary">
            How the contract value is forecast across the reporting periods .
            Current plan
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          {isConfirmed && canPlan && (
            <button
              onClick={onExport}
              className="px-4 py-2 rounded-full border border-gray-200 text-text-primary text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Export Schedule
            </button>
          )}
          {canPlan && !isConfirmed && (
            <>
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-3xl border border-gray-200 bg-white text-text-primary text-xs font-normal hover:bg-gray-50 transition-colors"
              >
                <RegenerateIcon className="w-5 h-5" />
                Regenerate
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || !isBalanced}
                className="px-4 py-2.5 rounded-3xl bg-primary shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] text-white text-xs font-normal hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirming ? "Confirming..." : "Confirm"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fallback notice */}
      <FallbackNotice warnings={warnings} />

      {/* KPIs */}
      <PlanKpis
        contractValue={contractValue}
        currency={currency}
        periodsCount={localPeriods.length}
        strategy={plan?.strategy}
        periods={localPeriods}
      />

      {/* Chart */}
      <div className="bg-bg-cards1 rounded-xl shadow p-6">
        <PlanChart periods={localPeriods} strategy={plan?.strategy} />
      </div>

      {/* Table */}
      <div className="bg-bg-cards1 rounded-xl shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-medium text-text-primary">
              Allocation Strategy:{" "}
              <span className="capitalize">
                {plan?.strategy?.replace(/_/g, " ")}
              </span>
            </h3>
            <p className="text-xs text-text-secondary">
              How the contract value is forecast across the reporting periods.
              Current plan
            </p>
          </div>
          {!isConfirmed && canPlan && (
            <div
              className={`text-xs font-medium px-3 py-1.5 rounded-full self-start ${
                isBalanced
                  ? "bg-status-track/10 text-status-track"
                  : "bg-status-risk/10 text-status-risk"
              }`}
            >
              {isBalanced
                ? `Balanced — total equals ${formatEGP(contractValue)} ${currency}`
                : `Remaining: ${formatEGP(remaining)} ${currency}`}
            </div>
          )}
        </div>

        <PlanTable
          periods={localPeriods}
          contractValue={contractValue}
          currency={currency}
          readOnly={isConfirmed || !canPlan}
          onChange={handlePeriodChange}
        />
      </div>
    </div>
  );
}
