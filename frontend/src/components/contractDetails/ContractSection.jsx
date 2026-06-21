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
        <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
          <button
            onClick={confirmContract}
            className="w-full whitespace-nowrap rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
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
  <div className="relative mb-5 rounded-xl bg-bg-cards1 p-2 shadow-sm sm:p-2.5">
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab}
          onClick={() => onSelect(tab)}
          className={`min-h-11 rounded-lg px-2 py-2 text-center text-[11px] leading-tight transition-colors sm:px-3 sm:text-[13px] ${
            active === tab
              ? "bg-primary font-medium text-white shadow-sm"
              : "bg-bg-main text-text-secondary hover:bg-bg-mainColor hover:text-primary"
          }`}
        >
          {tab}
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
    <div className="min-w-0 bg-bg-main">
      <ContractHeader contractData={contractData} readOnly={readOnly} />
      {!readOnly && (
        <ContractStepper
          steps={steps}
          currentStep={currentStep}
          stepStatus={stepStatus}
          progress={null}
        />
      )}
      <div className="min-w-0 pt-4">
        <ContractInnerTabs
          tabs={innerTabs}
          active={activeTab}
          onSelect={setActiveTab}
        />
        <div className="min-w-0">{sections[activeTab] ?? null}</div>
      </div>
    </div>
  );
};

export default ContractSection;
