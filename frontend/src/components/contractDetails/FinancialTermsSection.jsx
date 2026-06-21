import { useState, useContext } from "react";
import { ContractContext } from "../../context/EditContaractContext";
import { TrashIcon } from "../icons/TrashIcon";
import { PlusIcon } from "../icons/PlusIcon";
import { formatDate } from "../../utils/formatDate";

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

  const total = Number(local.quantity) * Number(local.unit_price);

  const inputCls = (extra = "") =>
    `w-full rounded-lg border border-border bg-bg-cards1 px-3 py-2 text-[13px]
     text-text-primary outline-none transition-colors lg:rounded-none lg:border-x-0
     lg:border-t-0 lg:border-b-transparent lg:bg-transparent lg:px-0 lg:py-0 lg:text-[13.5px] ${
       readOnly ? "cursor-default" : "focus:border-primary lg:focus:border-gray-300"
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
      {/* Name with tooltip */}
      <div className="group relative col-span-2 min-w-0 lg:col-span-1">
        <MobileLabel>Item</MobileLabel>
        <input
          value={local.name}
          onChange={
            readOnly
              ? undefined
              : (e) => setLocal((p) => ({ ...p, name: e.target.value }))
          }
          onBlur={readOnly ? undefined : () => onChange(local)}
          readOnly={readOnly}
          className={inputCls("truncate")}
        />
        {local.name && (
          <div
            className="
              absolute bottom-full left-0 mb-1.5
              px-2 py-1 rounded bg-gray-800 text-white text-xs
              whitespace-nowrap shadow-md
              opacity-0 group-hover:opacity-100
              transition-opacity duration-150
              pointer-events-none z-20
            "
          >
            {local.name}
          </div>
        )}
      </div>

      <div>
        <MobileLabel>Unit</MobileLabel>
        <input
          value={local.unit}
          onChange={
            readOnly
              ? undefined
              : (e) => setLocal((p) => ({ ...p, unit: e.target.value }))
          }
          onBlur={readOnly ? undefined : () => onChange(local)}
          readOnly={readOnly}
          className={inputCls("text-text-secondary text-left")}
        />
      </div>
      <div>
        <MobileLabel>Quantity</MobileLabel>
        <input
          value={local.quantity}
          onChange={
            readOnly
              ? undefined
              : (e) => setLocal((p) => ({ ...p, quantity: e.target.value }))
          }
          onBlur={readOnly ? undefined : () => onChange(local)}
          readOnly={readOnly}
          className={inputCls("text-left")}
        />
      </div>
      <div>
        <MobileLabel>Unit Price (EGP)</MobileLabel>
        <input
          value={local.unit_price}
          onChange={
            readOnly
              ? undefined
              : (e) => setLocal((p) => ({ ...p, unit_price: e.target.value }))
          }
          onBlur={readOnly ? undefined : () => onChange(local)}
          readOnly={readOnly}
          className={inputCls("text-left")}
        />
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
          <div className={`hidden ${UNIT_COLS} gap-2 bg-bg-grey px-4 py-3 lg:grid`}>
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
        value={local.date}
        onChange={
          readOnly
            ? undefined
            : (e) => setLocal((p) => ({ ...p, date: e.target.value }))
        }
        onBlur={readOnly ? undefined : () => onChange(local)}
        readOnly={readOnly}
        className={inputCls()}
      />
      <input
        value={local.amount}
        onChange={
          readOnly
            ? undefined
            : (e) => setLocal((p) => ({ ...p, amount: e.target.value }))
        }
        onBlur={readOnly ? undefined : () => onChange(local)}
        readOnly={readOnly}
        className={inputCls("font-medium")}
      />
      <input
        value={local.type}
        onChange={
          readOnly
            ? undefined
            : (e) => setLocal((p) => ({ ...p, type: e.target.value }))
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
