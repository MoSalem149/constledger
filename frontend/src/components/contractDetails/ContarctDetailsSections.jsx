import { useState } from "react";
import { overviewData } from "../../data/projectData";

import { ApprovalsSection } from "./ApprovalsSection";
import { BudgetAndProgressSection } from "../planning/BudgetAndProgressSection";
import ContractSection from "./ContractSection";
import { OverviewSection } from "./OverviewSection";

// =================== TABS ===================
const TABS = ["Overview", "Contract", "Planned Progress", "Approvals"];

const TabNavigation = ({ active, onSelect }) => (
  <div className=" mb-5 overflow-x-auto">
    <div className="flex gap-4 sm:gap-6 min-w-max sm:min-w-0">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          className={`pb-3 text-sm whitespace-nowrap relative transition-colors ${
            active === tab
              ? "font-medium text-text-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {tab}
          {active === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-bg-cards2 rounded-full" />
          )}
        </button>
      ))}
    </div>
  </div>
);

// =================== ANALYSIS FAILED BANNER ===================
const AnalysisFailedBanner = ({ contractData }) => (
  <div className="mb-6 border border-status-risk/30 bg-status-risk/5 rounded-lg px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-status-risk/10 text-status-risk flex items-center justify-center font-bold text-sm">
      !
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[14px] font-medium text-text-primary mb-0.5">
        AI Analysis Failed
      </p>
      <p className="text-[12.5px] text-text-secondary mb-3">
        The AI couldn't extract data from this contract. This is usually due to
        an API quota issue. You can fill in the contract details manually from
        the Contract tab.
      </p>
      <div className="flex flex-wrap gap-3 text-[12px] text-text-secondary">
        <span>
          <span className="text-text-primary font-medium">Contract:</span>{" "}
          {contractData.contractNumber}
        </span>
        <span>
          <span className="text-text-primary font-medium">File:</span>{" "}
          {contractData.contractDocId?.fileName ?? "—"}
        </span>
      </div>
    </div>
  </div>
);

// =================== MAIN ===================
export const ContarctDetailsSections = ({ contractData, readOnly }) => {
  const [activeTab, setActiveTab] = useState("Overview");

  const isFailed = contractData?.status === "analysis_failed";

  const sections = {
    Overview: <OverviewSection data={overviewData} />,
    Contract: (
      <ContractSection contractData={contractData} readOnly={readOnly} />
    ),
    "Planned Progress": (
      <BudgetAndProgressSection contractData={contractData} />
    ),
    Approvals: <ApprovalsSection />,
  };

  return (
    <div className="min-h-calc(100vh-685px) py-6 sm:py-10">
      {isFailed && <AnalysisFailedBanner contractData={contractData} />}
      <TabNavigation active={activeTab} onSelect={setActiveTab} />
      {sections[activeTab]}
    </div>
  );
};
