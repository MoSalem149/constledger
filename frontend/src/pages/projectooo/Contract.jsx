import { useState, Fragment } from "react";
import { contractData } from "../../data/projectData";

// =================== ICONS ===================
const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const CheckMark = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="3"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
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
const DollarIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const TrendIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);
const ClockIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const InfoIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// =================== STATUS DOT ===================
const statusClass = {
  green: "bg-green-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

const Dot = ({ status }) => (
  <div
    className={`w-2 h-2 rounded-full flex-shrink-0 ${statusClass[status]}`}
  />
);

// =================== CONTRACT HEADER ===================
const ContractHeader = ({ file }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start px-4 sm:px-6 pt-5 pb-4 ">
    <div>
      <p className="text-[11px] text-text-secondary tracking-widest mb-1.5">
        CONTRACTS . NEW . REVIEW
      </p>
      <h1 className="text-lg sm:text-xl font-medium text-text-primary mb-1">
        Review Extracted Contract Data
      </h1>
      <p className="text-xs text-text-secondary">{file}</p>
    </div>

    <div className="flex gap-2.5 flex-wrap">
      <button className="flex items-center gap-1.5 px-3.5 py-2 border border-border rounded-full text-[13px] text-text-primary bg-bg-cards1 whitespace-nowrap">
        <ArrowIcon /> Re-upload
      </button>
      <button className="px-4 py-2 rounded-full text-[13px] text-white bg-primary font-medium whitespace-nowrap">
        Confirm Contract
      </button>
    </div>
  </div>
);

// =================== EXTRACTION LEGEND ===================
const ExtractionLegend = ({ stats }) => (
  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-2.5 bg-bg-cards1 shadow rounded">
    <div className="flex flex-wrap gap-3 sm:gap-5">
      {[
        {
          color: "bg-green-500",
          label: "High confidence — verified pattern match",
        },
        { color: "bg-orange-500", label: "Low confidence — please review" },
        { color: "bg-red-500", label: "Not found — enter manually" },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div
            className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${color}`}
          />
          <span className="text-xs text-text-secondary">{label}</span>
        </div>
      ))}
    </div>
    <p className="text-xs text-text-secondary whitespace-nowrap">
      <span className="text-text-primary font-medium">
        {stats.total}/{stats.total} fields extracted.
      </span>{" "}
      <span className="text-primary font-medium">
        {stats.needReview} need review
      </span>
    </p>
  </div>
);

// =================== INNER TABS ===================
const ContractInnerTabs = ({ tabs, active, onSelect }) => (
  <div className="bg-bg-cards1 shadow rounded mb-5 overflow-x-auto px-4 sm:px-6 py-2.5">
    <div className="flex gap-4 sm:gap-5 min-w-max sm:min-w-0">
      {tabs.map((tab) => (
        <button
          key={tab.name}
          onClick={() => onSelect(tab.name)}
          className={`flex items-center gap-1.5 pb-3 text-[13.5px] whitespace-nowrap relative transition-colors
            ${active === tab.name ? "font-medium text-text-primary" : "text-text-secondary"}`}
        >
          {tab.name}
          {tab.badge && (
            <span className="bg-red-500 text-white text-[9.5px] font-bold rounded-full w-[15px] h-[15px] flex items-center justify-center">
              {tab.badge}
            </span>
          )}
          {active === tab.name && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  </div>
);

// =================== PARTY FIELD ===================
const PartyField = ({ label, status, value }) => {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-[100px] sm:w-[110px] flex-shrink-0">
        <Dot status={status} />
        <span className="text-[13px] text-text-primary truncate">{label}</span>
      </div>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Not found — leave blank or add"
        className="flex-1 min-w-0 px-3 py-2.5 border border-border rounded-lg text-[13px] text-text-primary placeholder:text-text-secondary bg-bg-cards1 outline-none focus:border-primary"
      />
      <button className="text-text-secondary p-1 flex-shrink-0">
        <TrashIcon />
      </button>
    </div>
  );
};

// =================== CONTRACT PARTIES ===================
const ContractPartiesSection = ({ parties }) => (
  <div className="mb-5">
    <p className="text-[15px] font-medium mb-1">Contract parties</p>
    <p className="text-xs text-text-secondary mb-3.5">
      Review, edit, or remove any optional data before saving
    </p>
    <div className="flex flex-col gap-2.5 mb-3">
      {parties.map((p, i) => (
        <PartyField key={i} {...p} />
      ))}
    </div>
    <button className="w-full py-2.5 border-2 border-dashed border-primary rounded-lg text-primary text-[13px] font-medium">
      + Add party
    </button>
  </div>
);

// =================== FIELD BOX ===================
const FieldBox = ({ label, status, value }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <Dot status={status} />
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
    <div className="px-3 py-2.5 border border-border rounded-lg text-[13px] text-text-primary">
      {value}
    </div>
  </div>
);

// =================== CONTRACT FIELDS GRID ===================
const ContractFieldsGrid = ({ fields }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
    {fields.map((f, i) => (
      <FieldBox key={i} {...f} />
    ))}
  </div>
);

// =================== PAYMENT CARDS ===================
const NoteBox = ({ bgClass, textClass, children }) => (
  <div className={`${bgClass} p-2 flex gap-2 items-start rounded`}>
    <div className={`${textClass} mt-0.5 flex-shrink-0`}>
      <InfoIcon />
    </div>
    <p className={`text-[11.5px] ${textClass} leading-relaxed`}>{children}</p>
  </div>
);

const AdvancePaymentCard = ({ data }) => (
  <div className="flex-1 border border-border rounded-xl overflow-hidden px-3.5">
    <div className="py-3.5">
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="w-[30px] h-[30px] rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
          <DollarIcon />
        </div>
        <span className="text-[13.5px] font-medium">Advance Payment</span>
      </div>
      <div className="mb-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Dot status="green" />
          <span className="text-xs text-text-secondary">Percentage</span>
        </div>
        <div className="px-3 py-2 border border-border rounded-lg text-[13px]">
          {data.percentage}
        </div>
      </div>
    </div>
    <NoteBox bgClass="bg-bg-onTrak" textClass="text-green-700">
      {data.note}
    </NoteBox>
  </div>
);

const ProgressPaymentCard = ({ data }) => (
  <div className="flex-1 border border-border rounded-xl p-3.5">
    <div className="flex items-center gap-2.5 mb-3.5">
      <div className="w-[30px] h-[30px] rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
        <TrendIcon />
      </div>
      <span className="text-[13.5px] font-medium">Progress Payment</span>
    </div>
    {[
      { label: "Basis", value: data.basis },
      { label: "Frequency", value: data.frequency },
      { label: "Payment Due", value: data.paymentDue },
    ].map(({ label, value }) => (
      <div key={label} className="mb-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Dot status="green" />
          <span className="text-xs text-text-secondary">{label}</span>
        </div>
        <div className="px-3 py-2 border border-border rounded-lg text-[13px]">
          {value}
        </div>
      </div>
    ))}
  </div>
);

const RetentionCard = ({ data }) => (
  <div className="flex-1 border border-border rounded-xl overflow-hidden px-3.5">
    <div className="py-3.5">
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="w-[30px] h-[30px] rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
          <ClockIcon />
        </div>
        <span className="text-[13.5px] font-medium">Retention</span>
      </div>
      <div className="mb-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Dot status="green" />
          <span className="text-xs text-text-secondary">Percentage</span>
        </div>
        <div className="px-3 py-2 border border-border rounded-lg text-[13px]">
          {data.percentage}
        </div>
      </div>
    </div>
    <NoteBox bgClass="bg-bg-atRisk100" textClass="text-orange-700">
      {data.note}
    </NoteBox>
  </div>
);

const PaymentTermsSection = ({ payment }) => (
  <div>
    <p className="text-[15px] font-medium mb-3.5">Payment Terms</p>
    {/* ✅ FIX: stack on mobile, row on md+ */}
    <div className="flex flex-col md:flex-row gap-3">
      <AdvancePaymentCard data={payment.advance} />
      <ProgressPaymentCard data={payment.progress} />
      <RetentionCard data={payment.retention} />
    </div>
  </div>
);

// =================== BASIC INFO CONTENT ===================
const BasicInfoContent = ({ data }) => (
  <div className="px-4 sm:px-6 py-2.5 bg-bg-cards1 shadow rounded">
    <ContractPartiesSection parties={data.parties} />
    <ContractFieldsGrid fields={data.fields} />
    <PaymentTermsSection payment={data.payment} />
  </div>
);

// =================== CONTRACT SECTION (MAIN) ===================
const ContractSection = () => {
  const [activeTab, setActiveTab] = useState("Basic Info");

  return (
    <div className="bg-bg-main min-h-screen">
      <ContractHeader file={contractData.file} />
      <ExtractionLegend stats={contractData.stats} />
      <div className="pt-4 pb-8">
        <ContractInnerTabs
          tabs={contractData.innerTabs}
          active={activeTab}
          onSelect={setActiveTab}
        />
        {activeTab === "Basic Info" ? (
          <BasicInfoContent data={contractData} />
        ) : (
          <div className="flex items-center justify-center h-40 text-text-secondary text-sm">
            {activeTab}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractSection;
