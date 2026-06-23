import { useState, useMemo, useCallback } from "react";
import RegenerateIcon from "../icons/RegenerateIcon";
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
    <div className="min-w-0 space-y-6 font-sans">
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
        <div className="flex w-full flex-wrap items-center gap-2 self-start sm:w-auto sm:gap-3">
          {isConfirmed && canPlan && (
            <button
              onClick={onExport}
              className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 sm:w-auto"
            >
              Export Schedule
            </button>
          )}
          {canPlan && !isConfirmed && (
            <>
              <button
                onClick={onRegenerate}
                className="flex flex-1 items-center justify-center gap-2 rounded-3xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-normal text-text-primary transition-colors hover:bg-gray-50 sm:flex-none"
              >
                <RegenerateIcon className="w-5 h-5" />
                Regenerate
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || !isBalanced}
                className="flex-1 rounded-3xl bg-primary px-4 py-2.5 text-xs font-normal text-white shadow-[0px_0px_4px_0px_rgba(255,72,0,1.00)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
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
      <div className="min-w-0 rounded-lg bg-bg-cards1 px-3 pb-8 pt-5 shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] sm:px-6 sm:pb-14 sm:pt-6">
        <PlanChart periods={localPeriods} strategy={plan?.strategy} />
      </div>

      {/* Table */}
      <div className="min-w-0 rounded-lg bg-bg-cards1 p-4 shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] sm:p-6">
        <PlanTable
          periods={localPeriods}
          contractValue={contractValue}
          readOnly={isConfirmed || !canPlan}
          onChange={handlePeriodChange}
          isConfirmed={isConfirmed}
          canPlan={canPlan}
          onExport={onExport}
          isBalanced={isBalanced}
          remaining={remaining}
          currency={currency}
        />
      </div>
    </div>
  );
}
