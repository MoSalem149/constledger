import { useContext, useEffect, useState } from "react";
import { TrashIcon } from "../icons/TrashIcon";
import { InfoIcon } from "../icons/InfoIcon";
import { ClockIcon } from "../icons/ClockIcon";
import { DollarIcon } from "../icons/DollarIcon.jsx";
import { TrendIcon } from "../icons/TrendIcon";
import { ContractContext } from "../../context/EditContaractContext.jsx";
import { addSpace } from "../../utils/textFormater.js";

// =================== STATUS DOT ===================
const Dot = () => (
  <div className={`w-2 h-2 rounded-full flex-shrink-0 bg-green-500`} />
);

// =================== PARTY FIELD ===================
const PartyField = ({
  index,
  role,
  name,
  onChangeName,
  onChangeRole,
  onDelete,
  onBlur,
  readOnly,
}) => {
  return (
    <div className="flex items-center gap-3">
      <input
        value={role ? addSpace(role) : "—"}
        onChange={
          readOnly ? undefined : (e) => onChangeRole(index, e.target.value)
        }
        onBlur={readOnly ? undefined : onBlur}
        readOnly={readOnly}
        className={`w-[140px] px-2 py-2.5 rounded-lg text-[13px] bg-bg-cards1 ${
          readOnly ? "cursor-default select-text" : ""
        }`}
      />
      <input
        value={name || ""}
        onChange={
          readOnly ? undefined : (e) => onChangeName(index, e.target.value)
        }
        onBlur={readOnly ? undefined : onBlur}
        readOnly={readOnly}
        placeholder={readOnly ? "—" : "Party name"}
        className={`flex-1 min-w-0 px-3 py-2.5 border border-border rounded-lg text-[13px] ${
          readOnly ? "cursor-default select-text bg-bg-cards1" : ""
        }`}
      />
      {!readOnly && (
        <button
          onClick={() => onDelete(index)}
          className="text-text-secondary p-1 flex-shrink-0"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
};

// =================== CONTRACT PARTIES ===================
const ContractPartiesSection = ({ parties = [], readOnly }) => {
  const { changeData } = useContext(ContractContext);
  const [localParties, setLocalParties] = useState(parties);

  useEffect(() => {
    setLocalParties(parties);
  }, [parties]);

  function handleChangeName(index, value) {
    setLocalParties((prev) =>
      prev.map((party, i) => (i === index ? { ...party, name: value } : party)),
    );
  }

  function handleChangeRole(index, value) {
    setLocalParties((prev) =>
      prev.map((party, i) => (i === index ? { ...party, role: value } : party)),
    );
  }

  function handleDelete(index) {
    const updated = localParties.filter((_, i) => i !== index);
    setLocalParties(updated);
    changeData({ parties: updated });
  }

  function handleAddParty() {
    const updated = [...localParties, { role: "new_party", name: "" }];
    setLocalParties(updated);
    changeData({ parties: updated });
  }

  function saveToContext() {
    changeData({ parties: localParties });
  }

  return (
    <div className="mb-5">
      <p className="text-[15px] font-medium mb-1">Contract parties</p>
      {!readOnly && (
        <p className="text-xs text-text-secondary mb-3.5">
          Review, edit, or remove any optional data before saving
        </p>
      )}

      <div className="flex flex-col gap-2.5 mb-3">
        {localParties.map((p, i) => (
          <PartyField
            key={i}
            index={i}
            role={p.role}
            name={p.name}
            onChangeName={handleChangeName}
            onChangeRole={handleChangeRole}
            onDelete={handleDelete}
            onBlur={saveToContext}
            readOnly={readOnly}
          />
        ))}
      </div>

      {!readOnly && (
        <button
          onClick={handleAddParty}
          className="w-full py-2.5 border-2 border-dashed border-primary rounded-lg text-primary text-[13px] font-medium"
        >
          + Add party
        </button>
      )}
    </div>
  );
};

// =================== FIELD BOX ===================
const FieldBox = ({ label, value, field, readOnly }) => {
  const { changeData } = useContext(ContractContext);
  const [val, setVal] = useState(value);

  function saveData() {
    changeData({ [field]: val });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Dot />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <input
        value={val || ""}
        onChange={readOnly ? undefined : (e) => setVal(e.target.value)}
        onBlur={readOnly ? undefined : saveData}
        readOnly={readOnly}
        className={`px-3 py-2.5 border border-border rounded-lg text-[13px] text-text-primary w-full ${
          readOnly ? "cursor-default select-text bg-bg-cards1" : ""
        }`}
      />
    </div>
  );
};

// =================== CONTRACT FIELDS GRID ===================
const ContractFieldsGrid = ({ fields, readOnly }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
    {fields.map((f, i) => (
      <FieldBox key={i} {...f} readOnly={readOnly} />
    ))}
  </div>
);

// =================== NOTE BOX ===================
const NoteBox = ({
  bgClass,
  textClass,
  children,
  onBlur,
  onChange,
  readOnly,
}) => (
  <div className={`${bgClass} p-2 flex gap-2 items-start rounded`}>
    <div className={`${textClass} mt-0.5 flex-shrink-0`}>
      <InfoIcon />
    </div>
    <textarea
      defaultValue={children}
      onChange={readOnly ? undefined : onChange}
      onBlur={readOnly ? undefined : onBlur}
      readOnly={readOnly}
      className={`text-[11.5px] ${textClass} leading-relaxed bg-transparent border-none outline-none w-full ${
        readOnly ? "cursor-default resize-none" : ""
      }`}
    />
  </div>
);

const AdvancePaymentCard = ({ data, readOnly }) => {
  const { changeData } = useContext(ContractContext);
  const [localData, setLocalData] = useState({
    percentage: data[0].percentage,
    description: data[0].description,
  });

  const handleBlur = (field) => {
    changeData({
      payment_terms: data.map((term, i) =>
        i === 0 ? { ...term, [field]: localData[field] } : term,
      ),
    });
  };

  return (
    <div className="flex-1 border border-border rounded-xl overflow-hidden px-3.5">
      <div className="py-3.5">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-[30px] h-[30px] rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
            <DollarIcon />
          </div>
          <span className="text-[13.5px] font-medium">{data[0].name}</span>
        </div>
        <div className="mb-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Dot />
            <span className="text-xs text-text-secondary">Percentage</span>
          </div>
          <input
            value={localData.percentage || ""}
            onChange={
              readOnly
                ? undefined
                : (e) =>
                    setLocalData((prev) => ({
                      ...prev,
                      percentage: e.target.value,
                    }))
            }
            onBlur={readOnly ? undefined : () => handleBlur("percentage")}
            readOnly={readOnly}
            className={`px-3 py-2 w-full border border-border rounded-lg text-[13px] ${
              readOnly ? "cursor-default select-text bg-bg-cards1" : ""
            }`}
          />
        </div>
      </div>
      <NoteBox
        bgClass="bg-bg-onTrak"
        textClass="text-green-700"
        onChange={
          readOnly
            ? undefined
            : (e) =>
                setLocalData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
        }
        onBlur={readOnly ? undefined : () => handleBlur("description")}
        readOnly={readOnly}
      >
        {localData.description}
      </NoteBox>
    </div>
  );
};

const ProgressPaymentCard = ({ data, readOnly }) => {
  const { changeData } = useContext(ContractContext);
  const [localData, setLocalData] = useState({
    basis: data.basis,
    frequency: data.frequency,
    dueTo: data.dueTo,
  });

  const fields = [
    { field: "basis", label: "Basis" },
    { field: "frequency", label: "Frequency" },
    { field: "dueTo", label: "Payment Due" },
  ];

  return (
    <div className="flex-1 border border-border rounded-xl p-3.5">
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="w-[30px] h-[30px] rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
          <TrendIcon />
        </div>
        <span className="text-[13.5px] font-medium">Progress Payment</span>
      </div>
      {fields.map(({ field, label }) => (
        <div key={field} className="mb-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Dot />
            <span className="text-xs text-text-secondary">{label}</span>
          </div>
          <input
            value={localData[field] || ""}
            onChange={
              readOnly
                ? undefined
                : (e) =>
                    setLocalData((prev) => ({
                      ...prev,
                      [field]: e.target.value,
                    }))
            }
            onBlur={
              readOnly
                ? undefined
                : () =>
                    changeData({
                      paymentProgress: { ...data, [field]: localData[field] },
                    })
            }
            readOnly={readOnly}
            className={`w-full px-3 py-2 border border-border rounded-lg text-[13px] ${
              readOnly ? "cursor-default select-text bg-bg-cards1" : ""
            }`}
          />
        </div>
      ))}
    </div>
  );
};

const RetentionCard = ({ data, readOnly }) => {
  const { changeData } = useContext(ContractContext);
  const [localData, setLocalData] = useState({
    percentage: data[2].percentage,
    description: data[2].description,
  });

  const handleBlur = (field) => {
    changeData({
      payment_terms: data.map((term, i) =>
        i === 2 ? { ...term, [field]: localData[field] } : term,
      ),
    });
  };

  return (
    <div className="flex-1 border border-border rounded-xl overflow-hidden px-3.5">
      <div className="py-3.5">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="min-w-[30px] min-h-[30px] rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <ClockIcon />
          </div>
          <span className="text-[13.5px] font-medium">{data[2].name}</span>
        </div>
        <div className="mb-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Dot />
            <span className="text-xs text-text-secondary">Percentage</span>
          </div>
          <input
            value={localData.percentage || ""}
            onChange={
              readOnly
                ? undefined
                : (e) =>
                    setLocalData((prev) => ({
                      ...prev,
                      percentage: e.target.value,
                    }))
            }
            onBlur={readOnly ? undefined : () => handleBlur("percentage")}
            readOnly={readOnly}
            className={`px-3 py-2 w-full border border-border rounded-lg text-[13px] ${
              readOnly ? "cursor-default select-text bg-bg-cards1" : ""
            }`}
          />
        </div>
      </div>
      <NoteBox
        bgClass="bg-bg-atRisk100"
        textClass="text-orange-700"
        onChange={
          readOnly
            ? undefined
            : (e) =>
                setLocalData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
        }
        onBlur={readOnly ? undefined : () => handleBlur("description")}
        readOnly={readOnly}
      >
        {localData.description}
      </NoteBox>
    </div>
  );
};

const PaymentTermsSection = ({ payment, readOnly }) => {
  const terms = payment.payment_terms ?? [];
  const progress = payment.paymentProgress;

  const hasAdvance = terms.length > 0;
  const hasRetention = terms.length > 2;
  const hasProgress = !!progress;

  if (!hasAdvance && !hasRetention && !hasProgress) {
    return (
      <div>
        <p className="text-[15px] font-medium mb-3.5">Payment Terms</p>
        <div className="border border-dashed border-gray-200 rounded-xl px-5 py-8 text-center">
          <p className="text-sm text-text-secondary">
            No payment terms extracted — fill in manually.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[15px] font-medium mb-3.5">Payment Terms</p>
      <div className="flex flex-col md:flex-row gap-3">
        {hasAdvance && <AdvancePaymentCard data={terms} readOnly={readOnly} />}
        {hasProgress && (
          <ProgressPaymentCard data={progress} readOnly={readOnly} />
        )}
        {hasRetention && <RetentionCard data={terms} readOnly={readOnly} />}
      </div>
    </div>
  );
};

// =================== BASIC INFO CONTENT ===================
export const BasicInfoContent = ({ data, readOnly }) => {
  const contractFields = [
    {
      value: data.contract_value,
      label: "Contract Value",
      field: "contract_value",
    },
    { value: data.currency, label: "Currency", field: "currency" },
    { value: data.duration_days, label: "Duration", field: "duration_days" },
    {
      value: data.reporting_period,
      label: "Reporting Period",
      field: "reporting_period",
    },
  ];

  return (
    <div className="px-4 sm:px-6 py-2.5 bg-bg-cards1 shadow rounded">
      <ContractPartiesSection parties={data.parties} readOnly={readOnly} />
      <ContractFieldsGrid fields={contractFields} readOnly={readOnly} />
      <PaymentTermsSection payment={data} readOnly={readOnly} />
    </div>
  );
};
