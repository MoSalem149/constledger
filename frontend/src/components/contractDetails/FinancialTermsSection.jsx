import { useState, useContext } from "react";
import { ContractContext } from "../../context/EditContaractContext";
import { TrashIcon } from "../icons/TrashIcon";
import { PlusIcon } from "../icons/PlusIcon";
import { formatDate } from "../../utils/formatDate";
import { validateUnitPriceRowFields } from "../../utils/contractValidation";

const ITEM_NAME_MAX = 200;
const UNIT_MAX = 30;
const QUANTITY_MAX = 9_999_999;
const UNIT_PRICE_MAX = 999_999_999_999;
const PAYMENT_TYPE_MAX = 50;
const DATE_INPUT_MAX = 24;

// Same shape as BasicInfoContent — strip non-numeric, allow one decimal, cap digits.
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

const AddBtn = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-center gap-1.5 px-3.5 py-2 shadow rounded-full
      text-[13px] text-text-primary bg-bg-cards1 hover:bg-gray-100 transition-colors
      self-start whitespace-nowrap sm:w-auto"
  >
    <PlusIcon /> {label}
  </button>
);
// =================== UNIT PRICES ===================
const UNIT_COLS = "lg:grid-cols-[2fr_100px_100px_150px_130px_44px]";

const UnitPriceRow = ({ row, onRemove, onChange, readOnly }) => {
  const [local, setLocal] = useState({
    name: row.name ?? "",
    unit: row.unit ?? "",
    quantity: row.quantity ?? 0,
    unit_price: row.unit_price ?? 0,
  });
  const [errors, setErrors] = useState({
    name: null,
    unit: null,
    quantity: null,
    unit_price: null,
  });

  const total = Number(local.quantity) * Number(local.unit_price);

  const rowForValidation = (fields) => ({
    name: fields.name ?? local.name,
    unit: fields.unit ?? local.unit,
    quantity: fields.quantity ?? local.quantity,
    unit_price: fields.unit_price ?? local.unit_price,
  });

  const blurField = (fields = local) => {
    const fieldErrors = validateUnitPriceRowFields(rowForValidation(fields));
    setErrors({
      name: fieldErrors.name ?? null,
      unit: fieldErrors.unit ?? null,
      quantity: fieldErrors.quantity ?? null,
      unit_price: fieldErrors.unit_price ?? null,
    });
    onChange(fields);
  };

  const inputCls = (extra = "", hasError = false) =>
    `w-full rounded-lg border bg-bg-cards1 px-3 py-2 text-[13px]
     text-text-primary outline-none transition-colors lg:rounded-none lg:border-x-0
     lg:border-t-0 lg:border-b-transparent lg:bg-transparent lg:px-0 lg:py-0 lg:text-[13.5px] ${
       hasError ? "border-status-risk" : "border-border"
     } ${
       readOnly
         ? "cursor-default"
         : "focus:border-primary lg:focus:border-gray-300"
     } ${extra}`;

  const MobileLabel = ({ children }) => (
    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-secondary lg:hidden">
      {children}
    </span>
  );

  return (
    <div
      className={`grid grid-cols-2 gap-3 rounded-lg border border-border bg-bg-main p-3 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-t lg:border-gray-100 lg:bg-transparent lg:px-4 lg:py-4 ${UNIT_COLS} lg:items-center`}
    >
      {/* Name with overflow-safe tooltip */}
      <div className="group relative col-span-2 min-w-0 lg:col-span-1">
        <MobileLabel>Item</MobileLabel>
        <input
          type="text"
          maxLength={ITEM_NAME_MAX}
          aria-label="Unit price item"
          value={local.name}
          onChange={
            readOnly
              ? undefined
              : (e) => {
                  const name = e.target.value.slice(0, ITEM_NAME_MAX);
                  setLocal((p) => ({ ...p, name }));
                  if (errors.name) setErrors((p) => ({ ...p, name: null }));
                }
          }
          onBlur={readOnly ? undefined : () => blurField(local)}
          readOnly={readOnly}
          aria-invalid={!!errors.name}
          className={inputCls("truncate", !!errors.name)}
        />
        {errors.name && (
          <p className="mt-1 text-[11px] text-status-risk lg:mt-0.5">
            {errors.name}
          </p>
        )}
        {local.name && (
          <div
            className="
              absolute bottom-full left-0 z-20 mb-1.5
              max-w-[min(24rem,calc(100vw-2rem))]
              break-words whitespace-normal rounded bg-gray-800 px-2 py-1 text-xs text-white
              opacity-0 shadow-md transition-opacity duration-150
              pointer-events-none group-hover:opacity-100
            "
          >
            {local.name}
          </div>
        )}
      </div>

      <div>
        <MobileLabel>Unit</MobileLabel>
        <input
          type="text"
          maxLength={UNIT_MAX}
          aria-label="Unit"
          value={local.unit}
          onChange={
            readOnly
              ? undefined
              : (e) => {
                  const unit = e.target.value.slice(0, UNIT_MAX);
                  setLocal((p) => ({ ...p, unit }));
                  if (errors.unit) setErrors((p) => ({ ...p, unit: null }));
                }
          }
          onBlur={readOnly ? undefined : () => blurField(local)}
          readOnly={readOnly}
          aria-invalid={!!errors.unit}
          className={inputCls("text-text-secondary text-left", !!errors.unit)}
        />
        {errors.unit && (
          <p className="mt-1 text-[11px] text-status-risk lg:mt-0.5">
            {errors.unit}
          </p>
        )}
      </div>
      <div>
        <MobileLabel>Quantity</MobileLabel>
        <input
          type="text"
          inputMode="numeric"
          maxLength={7}
          aria-label="Quantity"
          value={local.quantity}
          onChange={
            readOnly
              ? undefined
              : (e) => {
                  const quantity = sanitizeInteger(e.target.value, {
                    max: QUANTITY_MAX,
                  });
                  setLocal((p) => ({ ...p, quantity }));
                  if (errors.quantity) {
                    setErrors((p) => ({ ...p, quantity: null }));
                  }
                }
          }
          onBlur={
            readOnly
              ? undefined
              : () => blurField(local)
          }
          readOnly={readOnly}
          aria-invalid={!!errors.quantity}
          className={inputCls("text-left", !!errors.quantity)}
        />
        {errors.quantity && (
          <p className="mt-1 text-[11px] text-status-risk lg:mt-0.5">
            {errors.quantity}
          </p>
        )}
      </div>
      <div>
        <MobileLabel>Unit Price (EGP)</MobileLabel>
        <input
          type="text"
          inputMode="decimal"
          maxLength={18}
          aria-label="Unit price"
          value={local.unit_price}
          onChange={
            readOnly
              ? undefined
              : (e) => {
                  const unit_price = sanitizeDecimal(e.target.value, {
                    maxIntDigits: 12,
                  });
                  setLocal((p) => ({ ...p, unit_price }));
                  if (errors.unit_price) {
                    setErrors((p) => ({ ...p, unit_price: null }));
                  }
                }
          }
          onBlur={
            readOnly
              ? undefined
              : () => blurField(local)
          }
          readOnly={readOnly}
          aria-invalid={!!errors.unit_price}
          className={inputCls("text-left", !!errors.unit_price)}
        />
        {errors.unit_price && (
          <p className="mt-1 text-[11px] text-status-risk lg:mt-0.5">
            {errors.unit_price}
          </p>
        )}
      </div>
      <div>
        <MobileLabel>Total (EGP)</MobileLabel>
        <span className="flex min-h-9 items-center text-[13.5px] font-medium text-text-primary">
          {total.toLocaleString()}
        </span>
      </div>
      {!readOnly ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove unit price item"
          className="col-span-2 flex justify-end text-text-secondary transition-colors hover:text-status-risk lg:col-span-1 lg:justify-center"
        >
          <TrashIcon />
        </button>
      ) : (
        <span className="hidden lg:block" />
      )}
    </div>
  );
};

const UnitPricesSection = ({ data, readOnly }) => {
  const { changeData } = useContext(ContractContext);

  const [rows, setRows] = useState(
    (data.unit_prices ?? []).map((p, i) => ({
      id: i + 1,
      name: p.item ?? p.name ?? "",
      unit: p.unit ?? "",
      quantity: p.quantity ?? 0,
      unit_price: p.unit_price ?? 0,
    })),
  );

  const syncToContext = (updated) => {
    changeData({
      unit_prices: updated.map(({ id, ...rest }) => ({
        item: rest.name,
        unit: rest.unit,
        quantity: rest.quantity,
        unit_price: rest.unit_price,
        total_cost: Number(rest.quantity) * Number(rest.unit_price),
      })),
    });
  };

  const handleChange = (id, fields) => {
    const updated = rows.map((r) => (r.id === id ? { ...r, ...fields } : r));
    setRows(updated);
    syncToContext(updated);
  };

  const handleRemove = (id) => {
    const updated = rows.filter((r) => r.id !== id);
    setRows(updated);
    syncToContext(updated);
  };

  const handleAdd = () => {
    const updated = [
      { id: Date.now(), name: "", unit: "", quantity: 0, unit_price: 0 },
      ...rows,
    ];
    setRows(updated);
    syncToContext(updated);
  };

  const grandTotal = rows.reduce(
    (s, r) => s + Number(r.quantity) * Number(r.unit_price),
    0,
  );

  const total = rows.reduce((t, r) => {
    let totalR = r.unit_price * r.quantity;
    t = t + totalR;
    return t;
  }, 0);

  return (
    <div className="mb-6 min-w-0 rounded-lg bg-bg-cards1 p-4 shadow sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[17px] font-medium text-text-primary">
            Unit Prices
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {rows.length} items · Total {grandTotal.toLocaleString()} EGP
          </p>
        </div>
        {!readOnly && <AddBtn label="Add Item" onClick={handleAdd} />}
      </div>

      <div>
        <div className="flex flex-col gap-3 lg:block">
          <div
            className={`hidden ${UNIT_COLS} gap-2 bg-bg-grey px-4 py-3 lg:grid`}
          >
            {[
              "Item",
              "Unit",
              "Quantity",
              "Unit Price (EGP)",
              "Total (EGP)",
              "",
            ].map((h) => (
              <span
                key={h}
                className="text-[11px] font-semibold text-text-secondary tracking-widest text-left uppercase first:text-left last:text-left"
              >
                {h}
              </span>
            ))}
          </div>
          {rows.map((row) => (
            <UnitPriceRow
              key={row.id}
              row={row}
              onRemove={() => handleRemove(row.id)}
              onChange={(fields) => handleChange(row.id, fields)}
              readOnly={readOnly}
            />
          ))}
        </div>
        <div className="flex bg-bg-grey justify-between px-4 py-3">
          <div>Total:</div>
          <div className="mr-10">
            {total.toLocaleString()} {data.currency}
          </div>
        </div>
      </div>
    </div>
  );
};

// =================== PAYMENT TERMS ===================
const PaymentTermsSection = ({ data }) => {
  const terms = data.payment_terms ?? [];

  return (
    <div className="mb-8 bg-bg-cards1 p-4 rounded shadow">
      <h2 className="text-[17px] font-medium text-text-primary mb-1">
        Payment Terms
      </h2>
      <p className="text-xs text-text-secondary mb-4">{terms.length} terms</p>

      <div className="overflow-x-auto">
        <div className="min-w-[400px] overflow-hidden">
          <div className="grid grid-cols-[2fr_80px_2fr] bg-bg-grey px-4 py-3">
            {["Term", "%", "Description"].map((h) => (
              <span
                key={h}
                className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase"
              >
                {h}
              </span>
            ))}
          </div>
          {terms.map((t, i) => (
            <div
              key={i}
              className="grid grid-cols-[2fr_80px_2fr] px-4 py-3 items-center border-t border-gray-100"
            >
              <span className="text-[13.5px] text-text-primary">{t.name}</span>
              <span className="text-[13.5px] text-text-primary font-medium">
                {t.percentage != null ? `${t.percentage}%` : "—"}
              </span>
              <span className="text-[13px] text-text-secondary">
                {t.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =================== PAYMENT SCHEDULE ===================
const SCHED_COLS = "grid-cols-[1fr_170px_170px_44px]";

const PaymentRow = ({ payment, onRemove, onChange, readOnly }) => {
  const [local, setLocal] = useState({
    date: payment.date ?? "",
    amount: payment.amount ?? 0,
    type: payment.type ?? "",
  });

  const inputCls = (extra = "") =>
    `text-[13.5px] text-text-primary bg-transparent border-b border-transparent
     outline-none w-full transition-colors ${
       readOnly ? "cursor-default" : "focus:border-gray-300"
     } ${extra}`;

  return (
    <div
      className={`grid ${SCHED_COLS} px-4 py-4 items-center border-t border-gray-100`}
    >
      <input
        type="text"
        maxLength={DATE_INPUT_MAX}
        aria-label="Payment date"
        value={local.date}
        onChange={
          readOnly
            ? undefined
            : (e) =>
                setLocal((p) => ({
                  ...p,
                  date: e.target.value.slice(0, DATE_INPUT_MAX),
                }))
        }
        onBlur={readOnly ? undefined : () => onChange(local)}
        readOnly={readOnly}
        className={inputCls()}
      />
      <input
        type="text"
        inputMode="decimal"
        maxLength={18}
        aria-label="Payment amount"
        value={local.amount}
        onChange={
          readOnly
            ? undefined
            : (e) =>
                setLocal((p) => ({
                  ...p,
                  amount: sanitizeDecimal(e.target.value, { maxIntDigits: 12 }),
                }))
        }
        onBlur={readOnly ? undefined : () => onChange(local)}
        readOnly={readOnly}
        className={inputCls("font-medium")}
      />
      <input
        type="text"
        maxLength={PAYMENT_TYPE_MAX}
        aria-label="Payment type"
        value={local.type}
        onChange={
          readOnly
            ? undefined
            : (e) =>
                setLocal((p) => ({
                  ...p,
                  type: e.target.value.slice(0, PAYMENT_TYPE_MAX),
                }))
        }
        onBlur={readOnly ? undefined : () => onChange(local)}
        readOnly={readOnly}
        className={inputCls("text-text-secondary")}
      />
      {!readOnly ? (
        <button
          onClick={onRemove}
          className="flex justify-center text-text-secondary hover:text-status-risk transition-colors"
        >
          <TrashIcon />
        </button>
      ) : (
        <span />
      )}
    </div>
  );
};

const PaymentScheduleSection = ({ data, readOnly }) => {
  const { changeData } = useContext(ContractContext);

  const [payments, setPayments] = useState(
    (data.payment_schedule ?? []).map((p, i) => ({
      id: i + 1,
      date: formatDate(p.date),
      amount: p.amount,
      type: p.type ?? "IPC",
    })),
  );

  const syncToContext = (updated) => {
    changeData({ payment_schedule: updated.map(({ id, ...rest }) => rest) });
  };

  const handleChange = (id, fields) => {
    const updated = payments.map((p) =>
      p.id === id ? { ...p, ...fields } : p,
    );
    setPayments(updated);
    syncToContext(updated);
  };

  const handleRemove = (id) => {
    const updated = payments.filter((p) => p.id !== id);
    setPayments(updated);
    syncToContext(updated);
  };

  const handleAdd = () => {
    const updated = [
      { id: Date.now(), date: "", amount: 0, type: "" },
      ...payments,
    ];
    setPayments(updated);
    syncToContext(updated);
  };

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="bg-bg-cards1 p-4 rounded shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[17px] font-medium text-text-primary">
            Payment Schedule
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {payments.length} installments · Total {total.toLocaleString()} EGP
          </p>
        </div>
        {!readOnly && <AddBtn label="Add Installment" onClick={handleAdd} />}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[460px] overflow-hidden">
          <div className={`grid ${SCHED_COLS} bg-gray-100 px-4 py-3`}>
            {["Due Date", "Amount (EGP)", "Type", ""].map((h) => (
              <span
                key={h}
                className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase"
              >
                {h}
              </span>
            ))}
          </div>
          {payments.map((p) => (
            <PaymentRow
              key={p.id}
              payment={p}
              onRemove={() => handleRemove(p.id)}
              onChange={(fields) => handleChange(p.id, fields)}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// =================== EXPORT ===================
const FinancialTermsSection = ({ data, readOnly }) => (
  <div className="flex min-w-0 flex-col gap-4 bg-bg-main">
    <UnitPricesSection data={data} readOnly={readOnly} />
  </div>
);

export default FinancialTermsSection;