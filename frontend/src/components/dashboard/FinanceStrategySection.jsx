import { Link } from "react-router-dom";

// =================== HELPERS ===================
const formatStrategy = (strategy) => {
  if (!strategy) return "—";
  return strategy.replace(/_/g, "-").replace(/\b\w/g, (l) => l.toUpperCase());
};

const STRATEGY_COLORS = {
  s_curve: "#2563EB",
  straight_line: "#EF4444",
  milestone_weighted: "#6B7280",
};

const STRATEGY_DISPLAY = {
  s_curve: "S-curve",
  straight_line: "Straight Line",
  milestone_weighted: "Milestone-Weighted",
};

// =================== DONUT CHART ===================
const DonutChart = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const radius = 80;
  const strokeWidth = 18;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const segments = data.map((d) => {
    const segmentLength = (d.count / total) * circumference;
    const gapLength = circumference - segmentLength;
    const rotation = (accumulated / total) * 360 - 90;
    accumulated += d.count;
    return { ...d, segmentLength, gapLength, rotation };
  });

  return (
    <div className="flex items-center gap-6">
      {/* SVG Donut */}
      <div className="relative w-[180px] h-[180px] shrink-0">
        <svg
          width="180"
          height="180"
          viewBox="0 0 200 200"
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.segmentLength} ${seg.gapLength}`}
              strokeLinecap="butt"
              style={{
                transformOrigin: `${center}px ${center}px`,
                transform: `rotate(${seg.rotation}deg)`,
              }}
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-bold text-text-primary leading-none">
            {total}
          </span>
          <span className="text-[11px] text-text-secondary mt-0.5">
            Strategies
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[13px] text-text-secondary min-w-[100px]">
              {d.label}
            </span>
            <span className="text-[13px] font-semibold text-text-primary ml-auto">
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// =================== ROW ===================
const StrategyRow = ({ contract, planItem }) => {
  return (
    <Link
      to={`/contracts/${planItem.contractId}`}
      className="flex items-center font-sans justify-between py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors   "
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-2 h-2 bg-primary rounded-full shrink-0 mr-4" />
        <span className="text-sm font-medium text-text-primary truncate">
          {contract?.name || "Unknown Project"}
        </span>
      </div>
      <span className="text-sm font-medium text-text-primary ">
        {formatStrategy(planItem.plan?.strategy)}
      </span>
    </Link>
  );
};

// =================== SECTION ===================
export default function FinanceStrategySection({ contracts, plans }) {
  if (!plans || plans.length === 0) return null;

  // Merge plans with contract data
  const enrichedPlans = plans
    .map((planItem) => {
      const contract = contracts.find((c) => c.id === planItem.contractId);
      return { contract, planItem };
    })
    .filter((item) => item.contract);

  if (enrichedPlans.length === 0) return null;

  // Build strategy counts for donut chart
  const strategyCounts = {};
  enrichedPlans.forEach(({ planItem }) => {
    const s = planItem.plan?.strategy;
    if (s) strategyCounts[s] = (strategyCounts[s] || 0) + 1;
  });

  const donutData = Object.entries(strategyCounts)
    .map(([strategy, count]) => ({
      strategy,
      label: STRATEGY_DISPLAY[strategy] || formatStrategy(strategy),
      count,
      color: STRATEGY_COLORS[strategy] || "#9CA3AF",
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Strategy by Project */}
      <div className="flex flex-col lg:col-span-2 bg-bg-cards1 shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] rounded-lg  p-6 ">
        <div className="mb-4">
          <h2 className="text-lg mb-2 font-semibold text-text-primary">
            Strategy by Project
          </h2>
          <p className="text-xs text-text-secondary ">
            Across all active projects
          </p>
        </div>
        <div>
          {enrichedPlans.map(({ contract, planItem }) => (
            <StrategyRow
              key={planItem.contractId}
              contract={contract}
              planItem={planItem}
            />
          ))}
        </div>
      </div>

      {/* Right: Planning Strategy Mix */}
      <div className="flex flex-col bg-bg-cards1 shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] rounded-lg   p-6">
        <div className="mb-7">
          <h2 className="text-lg font-medium text-text-primary">
            Planning Strategy Mix
          </h2>
          <p className="text-xs text-text-secondary mt-2">
            Planned value by allocation strategy
          </p>
        </div>
        <div className=" flex items-center justify-center ">
          <DonutChart data={donutData} />
        </div>
      </div>
    </div>
  );
}
