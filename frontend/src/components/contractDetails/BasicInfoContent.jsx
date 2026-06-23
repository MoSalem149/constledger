import { useContext, useEffect, useState } from "react";
import { TrashIcon } from "../icons/TrashIcon";
import { InfoIcon } from "../icons/InfoIcon";
import { ClockIcon } from "../icons/ClockIcon";
import { DollarIcon } from "../icons/DollarIcon.jsx";
import { TrendIcon } from "../icons/TrendIcon";
import { ContractContext } from "../../context/EditContaractContext.jsx";
import { addSpace, formatRole } from "../../utils/textFormater.js";
import { computeEndDateFromDuration } from "../../utils/contractDates.js";

// Allow Latin + Arabic letters, spaces, hyphens, apostrophes, periods, commas, ampersands.
// Rejects purely numeric input and disallowed symbols. Required for party names/roles.
const STRING_ONLY_REGEX = /^[A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s'.,&-]*$/;
const PARTY_NAME_MAX = 150;
const PARTY_ROLE_MAX = 50;
const CURRENCY_MAX = 3;
const PERCENT_MIN = 1;
const PERCENT_MAX = 100;
const DURATION_MAX_DAYS = 3650;
const CONTRACT_VALUE_MAX = 999_999_999_999;
const TEXT_FIELD_MAX = 100;

// Keep only digits, one optional dot, and up to 2 decimal places. Caps integer part length.
const sanitizeDecimal = (raw, { maxIntDigits = 12 } = {}) => {
  if (raw == null) return "";
  let s = String(raw).replace(/[^0-9.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }
  const [intPart = "", decPart = ""] = s.split(".");
  const cappedInt = intPart.replace(/^0+(?=\d)/, "").slice(0, maxIntDigits);
  if (firstDot === -1) return cappedInt;
  return `${cappedInt}.${decPart.slice(0, 2)}`;
};

const sanitizeInteger = (raw, { max = Number.MAX_SAFE_INTEGER } = {}) => {
  if (raw == null) return "";
  const digits = String(raw).replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  const n = Number(digits);
  return n > max ? String(max) : digits;
};

// Clamp a percentage string into [PERCENT_MIN, PERCENT_MAX]. Empty input passes through.
const sanitizePercent = (raw) => {
  const cleaned = sanitizeDecimal(raw, { maxIntDigits: 3 });
  if (cleaned === "" || cleaned === ".") return cleaned;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return "";
  if (n > PERCENT_MAX) return String(PERCENT_MAX);
  return cleaned;
};

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
  const [errors, setErrors] = useState({});

  const handleRoleChange = (e) => {
    const val = e.target.value.slice(0, PARTY_ROLE_MAX);
    onChangeRole(index, val);
    if (errors.role) setErrors((p) => ({ ...p, role: undefined }));
  };

  const handleNameChange = (e) => {
    const val = e.target.value.slice(0, PARTY_NAME_MAX);
    onChangeName(index, val);
    if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
  };

  const handleBlur = () => {
    const next = {};
    if (name && !STRING_ONLY_REGEX.test(name.trim()))
      next.name = "Party name must be text (letters only, no pure numbers)";
    if (role && !STRING_ONLY_REGEX.test(formatRole(role).trim()))
      next.role = "Role must be text";
    setErrors(next);
    onBlur && onBlur();
  };

  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-bg-cards1 p-2.5 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-center sm:border-0 sm:p-0">
      <input
        type="text"
        maxLength={PARTY_ROLE_MAX}
        aria-label={`Party ${index + 1} role`}
        value={role ? formatRole(role) : ""}
        onChange={readOnly ? undefined : handleRoleChange}
        onBlur={readOnly ? undefined : handleBlur}
        readOnly={readOnly}
        aria-invalid={!!errors.role}
        className={`w-full px-2 py-2.5 rounded-lg text-[13px] bg-bg-cards1 ${
          readOnly ? "cursor-default select-text" : ""
        }`}
      />
      <div className="min-w-0">
        <input
          type="text"
          maxLength={PARTY_NAME_MAX}
          aria-label={`Party ${index + 1} name`}
          value={name || ""}
          onChange={readOnly ? undefined : handleNameChange}
          onBlur={readOnly ? undefined : handleBlur}
          readOnly={readOnly}
          aria-invalid={!!errors.name}
          placeholder={readOnly ? "" : "Party name"}
          className={`w-full min-w-0 px-3 py-2.5 border rounded-lg text-[13px] ${
            errors.name ? "border-status-risk" : "border-border"
          } ${readOnly ? "cursor-default select-text bg-bg-cards1" : ""}`}
        />
        {(errors.name || errors.role) && (
          <p className="mt-1 text-[11px] text-status-risk">
            {errors.name || errors.role}
          </p>
        )}
      </div>
      {!readOnly && (
        <button
          onClick={() => onDelete(index)}
          className="justify-self-end p-1 text-text-secondary transition-colors hover:text-status-risk sm:justify-self-auto"
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
    const updated = localParties.map((party, i) =>
      i === index ? { ...party, name: value } : party,
    );
    setLocalParties(updated);
    changeData({ parties: updated });
  }

  function handleChangeRole(index, value) {
    const updated = localParties.map((party, i) =>
      i === index ? { ...party, role: value } : party,
    );
    setLocalParties(updated);
    changeData({ parties: updated });
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
          className="w-full text-left p-2.5 border-2 border-dashed border-primary rounded-full text-primary text-[13px] font-medium"
        >
          + Add party
        </button>
      )}
    </div>
  );
};

// =================== FIELD BOX ===================
// Per-field rules — input attributes, sanitizer, and on-blur validator.
const VALID_REPORTING_PERIODS = ["weekly", "biweekly", "monthly"];

const FIELD_RULES = {
  contract_value: {
    inputType: "text",
    inputMode: "decimal",
    maxLength: 18,
    sanitize: (v) => sanitizeDecimal(v, { maxIntDigits: 12 }),
    validate: (v) => {
      if (v === "" || v == null) return "Contract value is required";
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) return "Must be a positive number";
      if (n > CONTRACT_VALUE_MAX) return "Value is too large";
      return null;
    },
  },
  currency: {
    inputType: "text",
    inputMode: "text",
    maxLength: CURRENCY_MAX,
    sanitize: (v) =>
      String(v ?? "")
        .replace(/[^A-Za-z]/g, "")
        .toUpperCase()
        .slice(0, CURRENCY_MAX),
    validate: (v) => {
      if (!v) return null;
      if (!/^[A-Z]{3}$/.test(v))
        return "Use a 3-letter ISO code (e.g. EGP, USD, EUR)";
      return null;
    },
  },
  duration_days: {
    inputType: "text",
    inputMode: "numeric",
    maxLength: 4,
    sanitize: (v) => sanitizeInteger(v, { max: DURATION_MAX_DAYS }),
    validate: (v) => {
      if (v === "" || v == null) return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1) return "Must be a positive whole number";
      if (n > DURATION_MAX_DAYS)
        return `Cannot exceed ${DURATION_MAX_DAYS} days`;
      return null;
    },
  },
  reporting_period: {
    inputType: "text",
    inputMode: "text",
    maxLength: 20,
    sanitize: (v) => String(v ?? "").slice(0, 20),
    validate: (v) => {
      if (!v) return "Reporting period is required";
      const n = v.toString().trim().toLowerCase();
      if (!VALID_REPORTING_PERIODS.includes(n) && n !== "biweekly")
        return 'Must be "weekly", "biweekly", or "monthly"';
      return null;
    },
    listId: "reporting-period-options",
  },
};

const FieldBox = ({ label, value, field, readOnly, contractData }) => {
  const { changeData } = useContext(ContractContext);
  const [val, setVal] = useState(value ?? "");
  const [error, setError] = useState(null);
  const [hint, setHint] = useState(null);
  const rules = FIELD_RULES[field] || {};

  useEffect(() => {
    setVal(value ?? "");
  }, [value]);

  const persistChange = (next) => {
    if (field !== "duration_days") {
      changeData({ [field]: next });
      return;
    }

    const days = Number(next);
    if (next === "" || !Number.isInteger(days) || days < 1) {
      changeData({ duration_days: next });
      setHint(null);
      return;
    }

    const startDate = contractData?.start_date;
    if (!startDate) {
      changeData({ duration_days: next });
      setHint(
        "Add a start date under Schedule and Milestones to auto-update the end date.",
      );
      return;
    }

    const endDate = computeEndDateFromDuration(startDate, days);
    if (!endDate) {
      changeData({ duration_days: next });
      setHint("Could not calculate end date — check the start date format.");
      return;
    }

    changeData({ duration_days: next, end_date: endDate });
    setHint(`End date updated to ${endDate}.`);
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    const next = rules.sanitize ? rules.sanitize(raw) : raw;
    setVal(next);
    if (error) setError(null);
    if (!readOnly) {
      persistChange(next);
    }
  };

  function saveData() {
    if (rules.validate) {
      const err = rules.validate(val);
      setError(err);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Dot />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <input
        type={rules.inputType || "text"}
        inputMode={rules.inputMode}
        maxLength={rules.maxLength}
        list={rules.listId}
        aria-label={label}
        aria-invalid={!!error}
        value={val}
        onChange={readOnly ? undefined : handleChange}
        onBlur={readOnly ? undefined : saveData}
        readOnly={readOnly}
        className={`px-3 py-2.5 border rounded-lg text-[13px] text-text-primary w-full ${
          error ? "border-status-risk" : "border-border"
        } ${readOnly ? "cursor-default select-text bg-bg-cards1" : ""}`}
      />
      {field === "reporting_period" && !readOnly && (
        <datalist id="reporting-period-options">
          <option value="weekly" />
          <option value="biweekly" />
          <option value="monthly" />
        </datalist>
      )}
      {error && <p className="mt-1 text-[11px] text-status-risk">{error}</p>}
      {hint && !error && (
        <p
          className={`mt-1 text-[11px] ${
            hint.startsWith("End date updated")
              ? "text-status-track"
              : "text-text-secondary"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

// =================== CONTRACT FIELDS GRID ===================
const ContractFieldsGrid = ({ fields, readOnly, contractData }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
    {fields.map((f, i) => (
      <FieldBox key={i} {...f} readOnly={readOnly} contractData={contractData} />
    ))}
  </div>
);

// =================== NOTE BOX ===================
const NoteBox = ({ bgClass, textClass, value, onBlur, onChange, readOnly }) => (
  <div className={`${bgClass} p-2 flex gap-2 items-start rounded-lg`}>
    <div className={`${textClass} mt-0.5 flex-shrink-0`}>
      <InfoIcon />
    </div>
    <div
      className={`text-[11.5px] ${textClass} leading-relaxed h-fit bg-transparent border-none outline-none w-full ${
        readOnly ? "cursor-default resize-none" : ""
      }`}
    >
      {value ?? ""}
    </div>
  </div>
);

const AdvancePaymentCard = ({ data, readOnly }) => {
  const { changeData } = useContext(ContractContext);

  const term0 = data?.[0] ?? {};

  const [localData, setLocalData] = useState({
    percentage: term0.percentage ?? "",
    description: term0.description ?? "",
  });

  useEffect(() => {
    const t = data?.[0] ?? {};
    setLocalData({
      percentage: t.percentage ?? "",
      description: t.description ?? "",
    });
  }, [data]);

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
          <span className="text-[13.5px] font-medium">{term0.name ?? ""}</span>
        </div>
        <div className="mb-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Dot />
            <span className="text-xs text-text-secondary">Percentage</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            maxLength={6}
            aria-label="Advance payment percentage"
            min={PERCENT_MIN}
            max={PERCENT_MAX}
            value={localData.percentage}
            onChange={
              readOnly
                ? undefined
                : (e) =>
                    setLocalData((prev) => ({
                      ...prev,
                      percentage: sanitizePercent(e.target.value),
                    }))
            }
            onBlur={readOnly ? undefined : () => handleBlur("percentage")}
            readOnly={readOnly}
            className={`px-3 py-2 w-full border border-border rounded-lg text-[13px] ${
              readOnly ? "cursor-default select-text bg-bg-cards1" : ""
            }`}
          />
          {!readOnly &&
            localData.percentage !== "" &&
            Number(localData.percentage) < PERCENT_MIN && (
              <p className="mt-1 text-[11px] text-status-risk">
                Percentage must be between {PERCENT_MIN} and {PERCENT_MAX}
              </p>
            )}
        </div>
      </div>
      <NoteBox
        bgClass="bg-bg-onTrak"
        textClass="text-green-700"
        value={localData.description}
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
      />
    </div>
  );
};

const ProgressPaymentCard = ({ data, readOnly }) => {
  const { changeData } = useContext(ContractContext);
  const [localData, setLocalData] = useState({
    basis: data?.basis ?? "",
    frequency: data?.frequency ?? "",
    dueTo: data?.dueTo ?? "",
  });

  useEffect(() => {
    setLocalData({
      basis: data?.basis ?? "",
      frequency: data?.frequency ?? "",
      dueTo: data?.dueTo ?? "",
    });
  }, [data]);

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
            type="text"
            maxLength={TEXT_FIELD_MAX}
            aria-label={label}
            value={localData[field]}
            onChange={
              readOnly
                ? undefined
                : (e) =>
                    setLocalData((prev) => ({
                      ...prev,
                      [field]: e.target.value.slice(0, TEXT_FIELD_MAX),
                    }))
            }
            onBlur={
              readOnly
                ? undefined
                : () =>
                    changeData({
                      paymentProgress: { ...data, ...localData },
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

  const term2 = data?.[2] ?? {};

  const [localData, setLocalData] = useState({
    percentage: term2.percentage ?? "",
    description: term2.description ?? "",
  });

  useEffect(() => {
    const t = data?.[2] ?? {};
    setLocalData({
      percentage: t.percentage ?? "",
      description: t.description ?? "",
    });
  }, [data]);

  const handleBlur = (field) => {
    changeData({
      payment_terms: data.map((term, i) => {
        if (i === 2) return { ...term, [field]: localData[field] };
        // Canonical retention lives at index 2 — clear duplicate retention rows
        // so other views don't re-sum stale percentages.
        if (
          field === "percentage" &&
          term.name?.toLowerCase().includes("retention")
        ) {
          return { ...term, percentage: "" };
        }
        return term;
      }),
    });
  };

  return (
    <div className="flex-1 border border-border rounded-xl overflow-hidden px-3.5">
      <div className="py-3.5">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="min-w-[30px] min-h-[30px] rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <ClockIcon />
          </div>
          <span className="text-[13.5px] font-medium">Retentions</span>
        </div>
        <div className="mb-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Dot />
            <span className="text-xs text-text-secondary">Percentage</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            maxLength={6}
            aria-label="Retention percentage"
            min={PERCENT_MIN}
            max={PERCENT_MAX}
            value={localData.percentage}
            onChange={
              readOnly
                ? undefined
                : (e) =>
                    setLocalData((prev) => ({
                      ...prev,
                      percentage: sanitizePercent(e.target.value),
                    }))
            }
            onBlur={readOnly ? undefined : () => handleBlur("percentage")}
            readOnly={readOnly}
            className={`px-3 py-2 w-full border border-border rounded-lg text-[13px] ${
              readOnly ? "cursor-default select-text bg-bg-cards1" : ""
            }`}
          />
          {!readOnly &&
            localData.percentage !== "" &&
            Number(localData.percentage) < PERCENT_MIN && (
              <p className="mt-1 text-[11px] text-status-risk">
                Percentage must be between {PERCENT_MIN} and {PERCENT_MAX}
              </p>
            )}
        </div>
      </div>
      <NoteBox
        bgClass="bg-bg-atRisk100"
        textClass="text-orange-700"
        value={localData.description}
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
      />
    </div>
  );
};

const PaymentTermsSection = ({ payment, readOnly }) => {
  const terms = payment.payment_terms ?? [];
  const progress = payment.paymentProgress ?? null;
  return (
    <div>
      <p className="text-[15px] font-medium mb-3.5">Payment Terms</p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <AdvancePaymentCard data={terms} readOnly={readOnly} />
        <ProgressPaymentCard data={progress} readOnly={readOnly} />
        <RetentionCard data={terms} readOnly={readOnly} />
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
    <div className="rounded-lg bg-bg-cards1 px-4 py-4 shadow sm:px-6">
      <ContractPartiesSection parties={data.parties} readOnly={readOnly} />
      <ContractFieldsGrid
        fields={contractFields}
        readOnly={readOnly}
        contractData={data}
      />
      <PaymentTermsSection payment={data} readOnly={readOnly} />
    </div>
  );
};
