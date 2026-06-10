const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const ApprovalsSection = () => (
  <div className="bg-bg-cards1 rounded-xl border border-gray-100 flex items-center justify-center py-20">
    <div className="text-center max-w-sm">
      <div className="w-11 h-11 rounded-xl bg-bg-grey flex items-center justify-center text-text-secondary mx-auto mb-5">
        <CheckIcon />
      </div>
      <h3 className="text-[17px] font-semibold text-text-primary mb-2.5">
        No approvals waiting
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        When the site team submits a new progress report, it'll appear here for
        your review. The most recent decision was on this project 2 weeks ago.
      </p>
    </div>
  </div>
);
