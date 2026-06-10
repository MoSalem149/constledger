import { useState } from "react";
import { TrashIcon } from "../icons/TrashIcon";
import { InfoIcon } from "../icons/InfoIcon";
import { ClockIcon } from "../icons/ClockIcon";
import { DollarIcon } from "../icons/DollarIcon.jsx";
import { TrendIcon } from "../icons/TrendIcon";

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
    <div className="flex flex-col md:flex-row gap-3">
      <AdvancePaymentCard data={payment.advance} />
      <ProgressPaymentCard data={payment.progress} />
      <RetentionCard data={payment.retention} />
    </div>
  </div>
);

// =================== BASIC INFO CONTENT ===================
export const BasicInfoContent = ({ data }) => (
  <div className="px-4 sm:px-6 py-2.5 bg-bg-cards1 shadow rounded">
    <ContractPartiesSection parties={data.parties} />
    <ContractFieldsGrid fields={data.fields} />
    <PaymentTermsSection payment={data.payment} />
  </div>
);
