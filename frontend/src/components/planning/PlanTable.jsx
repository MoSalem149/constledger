import { useState } from "react";
import {
  StraightLineGlyph,
  SCurveGlyph,
  MilestoneGlyph,
} from "../icons/StrategyGlyphs";

const STRATEGIES = [
  {
    key: "straight_line",
    title: "Straight Line",
    subtitle: "Equal amount every period",
    Glyph: StraightLineGlyph,
  },
  {
    key: "s_curve",
    title: "S-curve",
    subtitle: "Slow start, peak middle, taper-end",
    Glyph: SCurveGlyph,
  },
  {
    key: "milestone_weighted",
    title: "Milestone-weighted",
    subtitle: "More money in milestone periods",
    Glyph: MilestoneGlyph,
  },
];

export default function PlanningStrategyPicker({ onSelect, loading, canPlan }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="bg-bg-cards1 rounded-lg shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-text-primary mb-2">
          Choose an Allocation Strategy
        </h2>
        <p className="text-xs text-text-placeholder ">
          How the contract value is spread across the reporting periods
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {STRATEGIES.map((s) => {
          const isSelected = selected === s.key;
          return (
            <button
              key={s.key}
              onClick={() => canPlan && setSelected(s.key)}
              disabled={!canPlan}
              className={`relative text-left rounded-lg border px-4 pt-4 pb-6 transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-bg-mainColor shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
              } ${!canPlan ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <h3
                className={`text-sm font-medium mb-1 pr-6 ${
                  isSelected ? "text-primary" : "text-text-primary"
                }`}
              >
                {s.title}
              </h3>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                {s.subtitle}
              </p>
              <s.Glyph className="w-full h-20" selected={isSelected} />
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected || loading || !canPlan}
          className="px-6 py-2.5 rounded-full bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </div>
    </div>
  );
}