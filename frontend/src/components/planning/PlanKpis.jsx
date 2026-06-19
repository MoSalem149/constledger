import { useMemo } from "react";
import ValueIcon from "../icons/ValueIcon";
import ScheduleIcon from "../icons/ScheduleIcon";
import { TrendIcon } from "../icons/TrendIcon";
import { InfoIcon } from "../icons/InfoIcon";
import { formatShortEGP } from "../../utils/format";

export default function PlanKpis({
  contractValue,
  currency,
  periodsCount,
  strategy,
  periods,
}) {
  // Find the period with the maximum individual plannedAmount
  const peakPeriod = useMemo(() => {
    if (!Array.isArray(periods) || periods.length === 0) return null;
    let maxPeriod = periods[0];
    for (let i = 1; i < periods.length; i++) {
      if (
        (Number(periods[i].plannedAmount) || 0) >
        (Number(maxPeriod.plannedAmount) || 0)
      ) {
        maxPeriod = periods[i];
      }
    }
    return maxPeriod;
  }, [periods]);

  const peakCashValue =
    strategy === "straight_line"
      ? "Even Split"
      : peakPeriod?.periodLabel || "—";

  const peakCashSubtitle =
    strategy === "straight_line"
      ? "Equal each period"
      : `${formatShortEGP(Number(peakPeriod?.plannedAmount) || 0)} planned`;

  const items = [
    {
      label: "Contract Value",
      value: `${formatShortEGP(contractValue)} ${currency}`,
      subtitle: "Spread across the full plan",
      Icon: ValueIcon,
    },
    {
      label: "Reporting Periods",
      value: periodsCount,
      subtitle: "Monthly buckets",
      Icon: ScheduleIcon,
    },
    {
      label: "Peak Cash Period",
      value: peakCashValue,
      subtitle: peakCashSubtitle,
      Icon: TrendIcon,
    },
    {
      label: "Allocation Strategy",
      value: strategy
        ? strategy.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
        : "—",
      subtitle:
        strategy === "straight_line"
          ? "Linear spread"
          : strategy === "s_curve"
            ? "Construction default"
            : strategy === "milestone_weighted"
              ? "Construction default"
              : "—",
      Icon: InfoIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 font-sans sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-bg-cards1 shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] rounded-xl  px-8 py-6"
        >
          {/* Top row: icon + label */}
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <item.Icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-medium text-text-secondary">
              {item.label}
            </p>
          </div>
          {/* Bottom row: value + subtitle */}
          <div>
            <p className="text-2xl mb-2 font-medium text-text-primary">
              {item.value}
            </p>
            <p className="text-xs text-text-placeholder ">{item.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
