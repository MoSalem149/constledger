import { formatDate, formatEGP, formatPct } from "../../utils/format";

export default function PlanTable({ periods, contractValue, currency, readOnly, onChange }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="py-3 pr-4 font-medium text-text-secondary text-xs uppercase tracking-wider">
              Period
            </th>
            <th className="py-3 pr-4 font-medium text-text-secondary text-xs uppercase tracking-wider">
              Period Start
            </th>
            <th className="py-3 pr-4 font-medium text-text-secondary text-xs uppercase tracking-wider">
              Period End
            </th>
            <th className="py-3 pr-4 font-medium text-text-secondary text-xs uppercase tracking-wider text-right">
              Planned ({currency})
            </th>
            <th className="py-3 pr-4 font-medium text-text-secondary text-xs uppercase tracking-wider text-right">
              % of Contract
            </th>
            <th className="py-3 pr-4 font-medium text-text-secondary text-xs uppercase tracking-wider text-right">
              Cumulative ({currency})
            </th>
          </tr>
        </thead>
        <tbody>
          {periods.map((period, idx) => {
            const pct =
              contractValue > 0 ? (Number(period.plannedAmount) || 0) / contractValue : 0;
            return (
              <tr key={period.id || idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 pr-4 text-text-primary font-medium">
                  {period.periodLabel}
                </td>
                <td className="py-3 pr-4 text-text-secondary">
                  {formatDate(period.periodStart)}
                </td>
                <td className="py-3 pr-4 text-text-secondary">
                  {formatDate(period.periodEnd)}
                </td>
                <td className="py-3 pr-4 text-right">
                  {readOnly ? (
                    <span className="text-text-primary">
                      {formatEGP(period.plannedAmount)}
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
                <td className="py-3 pr-4 text-right text-text-secondary">
                  {formatPct(pct)}
                </td>
                <td className="py-3 pr-4 text-right text-text-primary font-medium">
                  {formatEGP(period.cumulativePlanned)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
