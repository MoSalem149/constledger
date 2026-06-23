import {
  formatDate,
  formatCompact,
  formatPct,
  formatShortEGP,
} from "../../utils/format";

export default function PlanTable({
  periods,
  contractValue,
  readOnly,
  onChange,
  isConfirmed,
  canPlan,
  onExport,
  isBalanced,
  remaining,
  currency,
}) {
  const totalPlanned = periods.reduce(
    (sum, p) => sum + (Number(p.plannedAmount) || 0),
    0,
  );
  const totalPct = contractValue > 0 ? totalPlanned / contractValue : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col font-sans sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-medium text-text-primary">
            Planned Amount by Period
          </h3>
          <p className="text-xs font-normal text-text-placeholder mt-2">
            Track planned project progress, period allocations, and cumulative
            budget
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 self-start sm:w-auto sm:items-end">
          {canPlan && (
            <button
              onClick={onExport}
              className="w-full rounded-3xl bg-button-active px-4 py-2.5 text-xs font-medium text-text-light shadow-[0px_0px_4px_0px_rgba(255,72,0,1.00)] transition-opacity hover:opacity-90 sm:w-auto"
            >
              Export Schedule
            </button>
          )}
          {!isConfirmed && canPlan && (
            <div
              className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                isBalanced
                  ? "bg-status-track/10 text-status-track"
                  : "bg-status-risk/10 text-status-risk"
              }`}
            >
              {isBalanced
                ? `Balanced — total equals ${formatShortEGP(contractValue)} ${currency}`
                : `Remaining: ${formatShortEGP(remaining)} ${currency}`}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="-mx-4 mt-6 overflow-x-auto bg-bg-cards1 px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[900px] table-auto">
          <colgroup>
            <col className="w-1/3" />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr className="bg-text-light">
              <th className="text-left text-text-secondary text-xs font-normal uppercase px-6 py-7">
                Period
              </th>
              <th className="text-left text-text-secondary text-xs font-normal uppercase px-6 py-7">
                Period Start
              </th>
              <th className="text-left text-text-secondary text-xs font-normal uppercase px-6 py-7">
                Period End
              </th>
              <th className="text-left text-text-secondary text-xs font-normal uppercase px-6 py-7 ">
                Planned
              </th>
              <th className="text-left text-text-secondary text-xs font-normal uppercase px-6 py-7 ">
                Cumulative
              </th>
              <th className="text-left text-text-secondary text-xs font-normal uppercase px-6 py-7 ">
                % of Contract
              </th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period, idx) => {
              const pct =
                contractValue > 0
                  ? (Number(period.plannedAmount) || 0) / contractValue
                  : 0;
              return (
                <tr
                  key={period.id || idx}
                  className="border-b border-gray-100 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-7 font-medium text-text-primary text-sm">
                    <div className="flex items-center gap-4">
                      <div>{period.periodLabel}</div>
                    </div>
                  </td>
                  <td className="px-6 py-7 text-text-placeholder font-medium text-sm">
                    {formatDate(period.periodStart)}
                  </td>
                  <td className="px-6 py-7 text-text-placeholder font-medium text-sm">
                    {formatDate(period.periodEnd)}
                  </td>
                  <td className="px-6 py-7 text-left">
                    {readOnly ? (
                      <span className="text-text-primary font-medium text-sm">
                        {formatCompact(period.plannedAmount)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={period.plannedAmount ?? ""}
                        onChange={(e) => onChange(idx, e.target.value)}
                        className="w-32 text-right px-2 py-1 rounded border border-gray-200 text-text-primary text-sm focus:outline-none focus:border-primary"
                      />
                    )}
                  </td>
                  <td className="px-6 py-7 text-left text-text-secondary font-medium text-sm">
                    {formatCompact(period.cumulativePlanned)}
                  </td>
                  <td className="px-6 py-7 text-left">
                    <div className="flex items-center justify-start gap-2">
                      <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(pct * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-text-secondary font-bold text-xs w-8 ">
                        {formatPct(pct)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-text-primary text-text-light ">
              <td
                className="px-6 py-6 font-medium rounded-bl-lg text-lg"
                colSpan={3}
              >
                Total planned
              </td>
              <td className="px-6 py-6 text-left  font-medium text-lg">
                {formatCompact(totalPlanned)}
              </td>
              <td className="px-6 py-6 text-left  font-medium text-lg">
                {formatCompact(totalPlanned)}
              </td>
              <td className="px-6 py-6 rounded-br-lg">
                <div className="flex items-center justify-start gap-2">
                  <div className="w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(totalPct * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold w-8 text-left">
                    {formatPct(totalPct)}
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
