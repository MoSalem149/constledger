import { useState, useContext } from "react";
import { ContractContext } from "../../context/EditContaractContext";
import { TrashIcon } from "../icons/TrashIcon";
import { PlusIcon } from "../icons/PlusIcon";
import { formatDate } from "../../utils/formatDate";

const AddBtn = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-lg
      text-[13px] text-text-primary bg-bg-cards1 hover:bg-gray-100 transition-colors
      self-start whitespace-nowrap"
  >
    <PlusIcon /> {label}
  </button>
);
// =================== UNIT PRICES ===================
const UnitPriceRow = ({ row, onRemove, onChange }) => {
  const [local, setLocal] = useState({
    name: row.item ?? row.name,
    unit: row.unit,
    price: row.unit_price ?? row.price,
  });

  return (
    <div className="grid grid-cols-[1fr_80px_160px_44px] px-4 py-4 items-center border-t border-gray-100">
      <input
        value={local.name}
        onChange={(e) => setLocal((p) => ({ ...p, name: e.target.value }))}
        onBlur={() => onChange(local)}
        className="text-[13.5px] text-text-primary bg-transparent border-b border-transparent
          focus:border-gray-300 outline-none w-full transition-colors truncate"
      />
      <input
        value={local.unit}
        onChange={(e) => setLocal((p) => ({ ...p, unit: e.target.value }))}
        onBlur={() => onChange(local)}
        className="text-[13.5px] text-text-secondary bg-transparent border-b border-transparent
          focus:border-gray-300 outline-none w-full transition-colors"
      />
      <input
        value={local.price}
        onChange={(e) => setLocal((p) => ({ ...p, price: e.target.value }))}
        onBlur={() => onChange(local)}
        className="text-[13.5px] text-text-primary font-medium text-right pr-4 bg-transparent
          border-b border-transparent focus:border-gray-300 outline-none w-full transition-colors"
      />
      <button
        onClick={onRemove}
        className="flex justify-center text-text-secondary hover:text-status-risk transition-colors"
      >
        <TrashIcon />
      </button>
    </div>
  );
};

const UnitPricesSection = ({ data }) => {
  const { changeData } = useContext(ContractContext);

  const [rows, setRows] = useState(
    (data.unit_prices ?? []).map((p, i) => ({
      id: i + 1,
      name: p.item,
      unit: p.unit,
      price: p.unit_price,
    })),
  );

  const syncToContext = (updated) => {
    changeData({
      unit_prices: updated.map(({ id, name, unit, price }) => ({
        item: name,
        unit,
        unit_price: price,
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
    const updated = [...rows, { id: Date.now(), name: "", unit: "", price: 0 }];
    setRows(updated);
    syncToContext(updated);
  };

  return (
    <div className="mb-8 bg-bg-cards1 p-4 rounded shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[17px] font-medium text-text-primary">
            Unit Prices
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Explore the pricing and measurement details for each unit included
            in the project
          </p>
        </div>
        <AddBtn label="Add Item" onClick={handleAdd} />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[460px] overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_160px_44px] bg-bg-grey px-4 py-4">
            <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
              Item
            </span>
            <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
              Unit
            </span>
            <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase text-right pr-4">
              Unit Price (EGP)
            </span>
            <span />
          </div>
          {rows.map((row) => (
            <UnitPriceRow
              key={row.id}
              row={row}
              onRemove={() => handleRemove(row.id)}
              onChange={(fields) => handleChange(row.id, fields)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// =================== PAYMENT SCHEDULE ===================
const PaymentRow = ({ payment, onRemove, onChange }) => {
  const [local, setLocal] = useState({
    date: payment.date,
    amount: payment.amount,
    type: payment.type ?? "",
  });

  return (
    <div className="grid grid-cols-[1fr_170px_170px_44px] px-4 py-4 items-center border-t border-gray-100">
      <input
        value={local.date}
        onChange={(e) => setLocal((p) => ({ ...p, date: e.target.value }))}
        onBlur={() => onChange(local)}
        className="text-[13.5px] text-text-primary bg-transparent border-b border-transparent
          focus:border-gray-300 outline-none w-full transition-colors"
      />
      <input
        value={local.amount}
        onChange={(e) => setLocal((p) => ({ ...p, amount: e.target.value }))}
        onBlur={() => onChange(local)}
        className="text-[13.5px] text-text-primary font-medium bg-transparent border-b border-transparent
          focus:border-gray-300 outline-none w-full transition-colors"
      />
      <input
        value={local.type}
        onChange={(e) => setLocal((p) => ({ ...p, type: e.target.value }))}
        onBlur={() => onChange(local)}
        className="text-[13.5px] text-text-secondary bg-transparent border-b border-transparent
          focus:border-gray-300 outline-none w-full transition-colors"
      />
      <button
        onClick={onRemove}
        className="flex justify-center text-text-secondary hover:text-status-risk transition-colors"
      >
        <TrashIcon />
      </button>
    </div>
  );
};

const PaymentScheduleSection = ({ data }) => {
  const { changeData } = useContext(ContractContext);

  const [payments, setPayments] = useState(
    (data.payment_schedule ?? []).map((p, i) => ({
      id: i + 1,
      date: formatDate(p.date),
      amount: p.amount,
      type: "IPC",
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
      ...payments,
      { id: Date.now(), date: "", amount: 0, type: "" },
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
        <AddBtn label="Add Installment" onClick={handleAdd} />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[460px] overflow-hidden">
          <div className="grid grid-cols-[1fr_170px_170px_44px] bg-gray-100 px-4 py-4">
            <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
              Due Date
            </span>
            <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
              Amount (EGP)
            </span>
            <span className="text-[11px] font-semibold text-text-secondary tracking-widest uppercase">
              Type
            </span>
            <span />
          </div>
          {payments.map((p) => (
            <PaymentRow
              key={p.id}
              payment={p}
              onRemove={() => handleRemove(p.id)}
              onChange={(fields) => handleChange(p.id, fields)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// =================== EXPORT ===================
const FinancialTermsSection = ({ data }) => (
  <div className="bg-bg-main">
    <UnitPricesSection data={data} />
    <PaymentScheduleSection data={data} />
  </div>
);

export default FinancialTermsSection;
