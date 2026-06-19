import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatEGP } from "../../utils/format";

const STRATEGY_DESCRIPTIONS = {
  straight_line: "equal planned amount every reporting period",
  s_curve: "slow start, peak mid-project, taper to completion",
  milestone_weighted:
    "more budget loaded into periods that contain a milestone",
};

function CustomXTick({ x, y, payload }) {
  if (!payload.value) return null;
  return (
    <text
      x={x}
      y={y}
      dy={14}
      textAnchor="middle"
      fill="currentColor"
      className="text-text-secondary text-sm font-medium"
    >
      {payload.value}
    </text>
  );
}

function CustomDot(props) {
  const { cx, cy, index } = props;
  if (index === 0) return null; // hide dot for the synthetic start point
  return <circle cx={cx} cy={cy} r={5.5} fill="#242424" />;
}

export default function PlanChart({ periods, strategy }) {
  // Add a synthetic start point so the line begins from the left edge at 0
  const data = [
    { label: "", plannedAmount: 0, cumulativePlanned: 0 },
    ...periods.map((p) => ({
      label: p.periodLabel,
      plannedAmount: Number(p.plannedAmount) || 0,
      cumulativePlanned: Number(p.cumulativePlanned) || 0,
    })),
  ];

  const strategyLabel = strategy
    ? strategy.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "Plan";
  const strategyDesc = strategy ? STRATEGY_DESCRIPTIONS[strategy] : "";

  return (
    <div className="w-full">
      {/* Header with title, subtitle, legend */}
      <div className="flex items-start justify-between ">
        <div>
          <h3 className="text-lg font-medium text-text-primary">
            Planned Spend Across The Contract
          </h3>
          <p className="text-xs text-text-placeholder font-normal mt-2">
            {strategyLabel} — {strategyDesc}
          </p>
        </div>
        <div className="flex items-center gap-4 font-normal text-[10px] text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
            <span>Planned this period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-[#242424]" />
            <span>Cumulative planned</span>
          </div>
        </div>
      </div>

      <div className="w-full h-72 mt-[86px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              stroke="#F5F5F5"
              vertical={false}
              strokeDasharray="none"
            />
            <XAxis
              dataKey="label"
              tick={<CustomXTick />}
              axisLine={{ stroke: "#EBEBEB" }}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "plannedAmount")
                  return [formatEGP(value), "Planned this period"];
                return [formatEGP(value), "Cumulative planned"];
              }}
              labelFormatter={(label) => label || ""}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #EBEBEB",
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="plannedAmount"
              name="Planned this period"
              fill="#FF4800"
              maxBarSize={56}
            />
            <Line
              dataKey="cumulativePlanned"
              name="Cumulative planned"
              stroke="#242424"
              strokeWidth={2.5}
              dot={<CustomDot />}
              type="linear"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
