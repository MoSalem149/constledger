import { formatDate, formatCompact, formatPct } from "../../utils/format";

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
        <div className="flex items-center gap-3 self-start">
          {canPlan && (
            <button
              onClick={onExport}
              className="px-4 py-2.5 rounded-3xl shadow-[0px_0px_4px_0px_rgba(255,72,0,1.00)] bg-button-active text-text-light text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Export Schedule
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto p-6 bg-bg-cards1 rounded-lg mt-6">
        <table className="table-auto w-full">
          <colgroup>
            <col className="w-1/3" />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr className="bg-bg-grey">
              <th className="text-left text-text-secondary text-xs font-medium uppercase px-6 py-7">
                Period
              </th>
              <th className="text-left text-text-secondary text-xs font-medium uppercase px-6 py-7">
                Period Start
              </th>
              <th className="text-left text-text-secondary text-xs font-medium uppercase px-6 py-7">
                Period End
              </th>
              <th className="text-left text-text-secondary text-xs font-medium uppercase px-6 py-7 ">
                Planned
              </th>
              <th className="text-left text-text-secondary text-xs font-medium uppercase px-6 py-7 ">
                Cumulative
              </th>
              <th className="text-left text-text-secondary text-xs font-medium uppercase px-6 py-7 ">
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
                  <td className="px-6 py-7 text-text-secondary text-sm">
                    {formatDate(period.periodStart)}
                  </td>
                  <td className="px-6 py-7 text-text-secondary text-sm">
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
                  <td className="px-6 py-7 text-left text-text-primary font-medium text-sm">
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
                      <span className="text-text-secondary text-xs w-8 ">
                        {formatPct(pct)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#242424] text-white ">
              <td
                className="px-6 py-6 font-semibold rounded-bl-lg text-sm"
                colSpan={3}
              >
                Total planned
              </td>
              <td className="px-6 py-6 text-left text-sm font-medium">
                {formatCompact(totalPlanned)}
              </td>
              <td className="px-6 py-6 text-left text-sm font-medium">
                {formatCompact(totalPlanned)}
              </td>
              <td className="px-6 py-6">
                <div className="flex items-center justify-start gap-2">
                  <div className="w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(totalPct * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs w-8 text-left">
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
