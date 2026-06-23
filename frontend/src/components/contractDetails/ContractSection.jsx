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

// Valid reporting period values accepted by the planning service
const VALID_REPORTING_PERIODS = ["weekly", "biweekly", "monthly"];

// Normalize the same way the backend does so we can pre-validate
const normalizeReportingPeriod = (value) => {
  if (!value) return undefined;
  const n = value.toString().trim().toLowerCase();
  if (n === "weekly") return "weekly";
  if (
    n === "biweekly" ||
    n === "2 weeks" ||
    n === "2-weekly" ||
    n === "2-weeks" ||
    n === "15 days" ||
    n === "15-day" ||
    n === "15days"
  )
    return "biweekly";
  if (n === "monthly") return "monthly";
  return undefined;
};

// =================== VALIDATION ===================
/**
 * Returns an array of validation error objects.
 * Each error: { field, label, tab }
 * contractData = AI-extracted base, editedData = user edits merged on top.
 */
const validateForPlan = (contractData, editedData) => {
  const merged = { ...contractData, ...editedData };
  const errors = [];

  // 1. Contract value — must be a positive number
  const rawValue = merged.contract_value;
  const numValue =
    typeof rawValue === "number"
      ? rawValue
      : parseFloat(String(rawValue ?? "").replace(/,/g, ""));
  if (!rawValue || isNaN(numValue) || numValue <= 0) {
    errors.push({
      field: "contract_value",
      label: "Contract Value",
      tab: "Basic Info",
      hint: "Enter the total contract amount (e.g. 5,000,000)",
    });
  }

  // 2. Start date
  if (!merged.start_date || merged.start_date === "") {
    errors.push({
      field: "start_date",
      label: "Start Date",
      tab: "Schedule and Milestones",
      hint: "Enter the contract start date",
    });
  }

  // 3. End date
  if (!merged.end_date || merged.end_date === "") {
    errors.push({
      field: "end_date",
      label: "End Date",
      tab: "Schedule and Milestones",
      hint: "Enter the contract end date",
    });
  }

  // 4. End must be after start (only if both provided)
  if (merged.start_date && merged.end_date) {
    const s = new Date(merged.start_date);
    const e = new Date(merged.end_date);
    if (!isNaN(s) && !isNaN(e) && e <= s) {
      errors.push({
        field: "end_date_range",
        label: "End Date",
        tab: "Schedule and Milestones",
        hint: "End date must be after the start date",
      });
    }
  }

  // 5. Reporting period — must map to weekly / biweekly / monthly
  const normalizedPeriod = normalizeReportingPeriod(merged.reporting_period);
  if (!merged.reporting_period || !normalizedPeriod) {
    errors.push({
      field: "reporting_period",
      label: "Reporting Period",
      tab: "Basic Info",
      hint: 'Must be "weekly", "biweekly" (or "15 days"), or "monthly"',
    });
  }

  return errors;
};

// =================== VALIDATION MODAL ===================
const ValidationModal = ({ errors, onClose, onGoToTab }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
    <div className="w-full max-w-md rounded-2xl bg-bg-cards1 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-border">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-status-risk/10 text-status-risk flex items-center justify-center font-bold text-sm">
          !
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] font-semibold text-text-primary">
            Required Fields Missing
          </p>
          <p className="text-[12px] text-text-secondary mt-0.5">
            The following fields are required to generate the financial plan.
            Please fill them in before confirming.
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Error list */}
      <ul className="px-5 py-4 flex flex-col gap-3">
        {errors.map((err, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-lg border border-border bg-bg-main p-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-text-primary">
                {err.label}
              </p>
              <p className="text-[11.5px] text-text-secondary mt-0.5">
                {err.hint}
              </p>
            </div>
            <button
              onClick={() => {
                onGoToTab(err.tab);
                onClose();
              }}
              className="flex-shrink-0 text-[11.5px] font-medium text-primary border border-primary/30 rounded-full px-3 py-1 hover:bg-primary/5 transition-colors whitespace-nowrap"
            >
              Go to {err.tab === "Schedule and Milestones" ? "Schedule" : err.tab}
            </button>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="px-5 pb-5">
        <button
          onClick={onClose}
          className="w-full rounded-full border border-border py-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          Close and fill manually
        </button>
      </div>
    </div>
  </div>
);

// =================== CONTRACT HEADER ===================
const ContractHeader = ({ contractData, readOnly, onValidationFail }) => {
  const { data } = useContext(ContractContext);
  const navigate = useNavigate();

  const confirmContract = () => {
    // Validate before saving
    const errors = validateForPlan(contractData, data);
    if (errors.length > 0) {
      onValidationFail(errors);
      return;
    }

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
const ContractInnerTabs = ({ tabs, active, onSelect, errorTabs = [] }) => (
  <div className="relative mb-5 rounded-xl bg-bg-cards1 p-2 shadow-sm sm:p-2.5">
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab}
          onClick={() => onSelect(tab)}
          className={`relative min-h-11 rounded-lg px-2 py-2 text-center text-[11px] leading-tight transition-colors sm:px-3 sm:text-[13px] ${
            active === tab
              ? "bg-primary font-medium text-white shadow-sm"
              : "bg-bg-main text-text-secondary hover:bg-bg-mainColor hover:text-primary"
          }`}
        >
          {tab}
          {/* Red dot indicator for tabs with validation errors */}
          {errorTabs.includes(tab) && active !== tab && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-status-risk" />
          )}
        </button>
      ))}
    </div>
  </div>
);

// =================== CONTRACT SECTION (MAIN) ===================
const ContractSection = ({ contractData, readOnly }) => {
  const [activeTab, setActiveTab] = useState("Basic Info");
  const [validationErrors, setValidationErrors] = useState([]);
  const [showModal, setShowModal] = useState(false);

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

  // Tabs that have validation errors (for red-dot indicators)
  const errorTabs = [...new Set(validationErrors.map((e) => e.tab))];

  const handleValidationFail = (errors) => {
    setValidationErrors(errors);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleGoToTab = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-w-0 bg-bg-main">
      {showModal && (
        <ValidationModal
          errors={validationErrors}
          onClose={handleCloseModal}
          onGoToTab={handleGoToTab}
        />
      )}

      <ContractHeader
        contractData={contractData}
        readOnly={readOnly}
        onValidationFail={handleValidationFail}
      />
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
          onSelect={(tab) => {
            setActiveTab(tab);
          }}
          errorTabs={errorTabs}
        />
        <div className="min-w-0">{sections[activeTab] ?? null}</div>
      </div>
    </div>
  );
};

export default ContractSection;