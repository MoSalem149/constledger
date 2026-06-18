import { useState, useContext } from "react";

import FinancialTermsSection from "./FinancialTermsSection";
import ScheduleMilestonesSection from "./ScheduleMilestonesSection";
import PenaltiesSection from "./PenaltiesSection";
import { BasicInfoContent } from "./BasicInfoContent";
import ContractStepper from "../contracts/ContractStepper";
import { contractService } from "../../services/contractService";
import { ContractContext } from "../../context/EditContaractContext";
import { useNavigate } from "react-router-dom";

const steps = [
  { key: "upload", label: "Upload" },
  { key: "read", label: "Read" },
  { key: "extract", label: "Extract" },
  { key: "review", label: "Review" },
];
const stepStatus = ["completed", "completed", "completed", "active-review"];

const currentStepIndex = stepStatus.findIndex(
  (s) => s === "active" || s === "active-review",
);
const currentStep =
  currentStepIndex >= 0 ? currentStepIndex : stepStatus.length - 1;

// =================== ICONS ===================
const ArrowIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

// =================== CONTRACT HEADER ===================
const ContractHeader = ({ contractData, readOnly }) => {
  const { data } = useContext(ContractContext);
  const navigate = useNavigate();

  const confirmContract = () => {
    try {
      const id = contractData?._id || contractData?.id;
      const payload = { status: "active", ...data };
      contractService.EditContractById(id, payload);
      navigate("/contracts");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start px-4 sm:px-6 pt-5 pb-4">
      <div>
        <p className="text-[11px] text-text-secondary tracking-widest mb-1.5">
          {readOnly ? "CONTRACTS . DETAILS" : "CONTRACTS . NEW . REVIEW"}
        </p>
        <h1 className="text-lg sm:text-xl font-medium text-text-primary mb-1">
          {readOnly ? "Contract Details" : "Review Extracted Contract Data"}
        </h1>
      </div>

      {/* Only show action buttons in edit mode */}
      {!readOnly && (
        <div className="flex gap-2.5 flex-wrap">
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-border rounded-full text-[13px] text-text-primary bg-bg-cards1 whitespace-nowrap">
            <ArrowIcon /> Re-upload
          </button>
          <button
            onClick={confirmContract}
            className="px-4 py-2 rounded-full text-[13px] text-white bg-primary font-medium whitespace-nowrap"
          >
            Confirm Contract
          </button>
        </div>
      )}
    </div>
  );
};

// =================== INNER TABS ===================
const ContractInnerTabs = ({ tabs, active, onSelect }) => (
  <div className="bg-bg-cards1 shadow rounded mb-5 overflow-x-auto px-4 sm:px-6 py-2.5">
    <div className="flex gap-4 sm:gap-5 min-w-max sm:min-w-0">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          className={`flex items-center gap-1.5 pb-3 text-[13.5px] whitespace-nowrap relative transition-colors
            ${active === tab ? "font-medium text-text-primary" : "text-text-secondary"}`}
        >
          {tab}
          {active === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  </div>
);

// =================== CONTRACT SECTION (MAIN) ===================
const ContractSection = ({ contractData, readOnly }) => {
  const [activeTab, setActiveTab] = useState("Basic Info");

  const sections = {
    "Basic Info": <BasicInfoContent data={contractData} readOnly={readOnly} />,
    "Financial Terms": (
      <FinancialTermsSection data={contractData} readOnly={readOnly} />
    ),
    "Schedule and Milestones": (
      <ScheduleMilestonesSection data={contractData} readOnly={readOnly} />
    ),
    Penalties: <PenaltiesSection data={contractData} readOnly={readOnly} />,
  };

  const innerTabs = [
    "Basic Info",
    "Financial Terms",
    "Schedule and Milestones",
    "Penalties",
  ];

  return (
    <div className="bg-bg-main min-h-screen">
      <ContractHeader contractData={contractData} readOnly={readOnly} />
      {!readOnly && (
        <ContractStepper
          steps={steps}
          currentStep={currentStep}
          stepStatus={stepStatus}
          progress={null}
        />
      )}
      <div className="pt-4 ">
        <ContractInnerTabs
          tabs={innerTabs}
          active={activeTab}
          onSelect={setActiveTab}
        />
        {sections[activeTab] ?? null}
      </div>
    </div>
  );
};

export default ContractSection;
