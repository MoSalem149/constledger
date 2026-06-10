const ChartIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

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
