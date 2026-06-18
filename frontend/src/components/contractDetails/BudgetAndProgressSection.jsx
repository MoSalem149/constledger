import { ChartIcon } from "../icons/ChartIcon";

export const BudgetAndProgressSection = () => (
  <div className="bg-bg-cards1 rounded-xl border border-gray-100 flex items-center justify-center py-20">
    <div className="text-center max-w-sm">
      <div className="w-11 h-11 rounded-xl bg-bg-grey flex items-center justify-center text-text-secondary mx-auto mb-5">
        <ChartIcon />
      </div>
      <h3 className="text-[17px] font-semibold text-text-primary mb-2.5">
        Budget tracking starts after the first progress report
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        The project is at 61% of plan. Once the site team submits actual
        progress, you'll see planned vs actual breakdowns here.
      </p>
    </div>
  </div>
);
