import { useState } from "react";
import { overviewData } from "../../data/projectData";

import { ApprovalsSection } from "./ApprovalsSection";
import { BudgetAndProgressSection } from "./BudgetAndProgressSection";
import ContractSection from "./ContractSection";
import { OverviewSection } from "./OverviewSection";

// =================== TABS ===================
const TABS = ["Overview", "Contract", "Budget and Progress", "Approvals"];

const TabNavigation = ({ active, onSelect }) => (
  <div className="border-b border-border mb-5 overflow-x-auto">
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
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 rounded-full" />
          )}
        </button>
      ))}
    </div>
  </div>
);

export const ContarctDetailsSections = ({ contractData }) => {
  const [activeTab, setActiveTab] = useState("Overview");

  const sections = {
    Overview: <OverviewSection data={overviewData} />,
    Contract: <ContractSection contractoData={contractData} />,
    "Budget and Progress": <BudgetAndProgressSection />,
    Approvals: <ApprovalsSection />,
  };

  return (
    <div className="min-h-screen py-6 sm:py-10">
      <TabNavigation active={activeTab} onSelect={setActiveTab} />
      {sections[activeTab]}
    </div>
  );
};
