// =================== HELPERS ===================
const formatValue = (val, currency) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M ${currency}`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K ${currency}`;
  return `${val} ${currency}`;
};

// =================== DOT ===================
const OrangeDot = () => (
  <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary rounded-full" />
);
const WhiteDot = () => (
  <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-white rounded-full" />
);

// =================== ORANGE CARD ===================
const OrangeCard = ({ value, label, sub }) => (
  <div className="relative text-[10px] shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] font-normal font-sans bg-primary  rounded-lg p-4 flex flex-col justify-between ">
    <WhiteDot />
    <div>
      <div className="text-[10px] font-normal text-text-light mb-2">
        {label}
      </div>
      <div className="text-lg font-medium text-text-light mb-2 leading-tight">
        {value}
      </div>
    </div>
    {sub && (
      <div className="text-[10px] font-normal text-text-light ">{sub}</div>
    )}
  </div>
);

// =================== WHITE CARD ===================
const WhiteCard = ({ value, label, sub }) => (
  <div className="relative  rounded-lg bg-bg-cards1 font-sans shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] p-4 flex flex-col justify-between ">
    <OrangeDot />
    <div>
      <div className="text-[10px] font-normal text-text-secondary mb-2">
        {label}
      </div>
      <div className="text-lg font-medium text-text-primary mb-2 leading-5">
        {value}
      </div>
    </div>
    {sub && <div className="text-[10px] font-normal text-gray-300 ">{sub}</div>}
  </div>
);

// =================== SECTION ===================
export default function OverviewCards({ contracts, activeContracts, plans, reportData }) {
  const totalValue = contracts.reduce(
    (sum, c) => sum + (c.contractValue || 0),
    0,
  );
  const mainCurrency = contracts[0]?.currency || "EGP";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <OrangeCard
        value={formatValue(totalValue, mainCurrency)}
        label="Total Planned Value"
        sub={`${contracts.length} projects . all currencies normalised`}
      />
      <WhiteCard
        value={plans.length}
        label="Total Project Plans"
        sub="Every project has its own strategy"
      />
      <WhiteCard
        value={activeContracts.length}
        label="Active Contracts"
        sub={`of ${contracts.length} total projects`}
      />
      <WhiteCard
        value={reportData?.contractCount ?? 0}
        label="Reports"
        sub="of all projects"
      />
    </div>
  );
}