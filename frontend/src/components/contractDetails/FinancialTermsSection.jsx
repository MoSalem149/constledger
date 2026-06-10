import { useState } from "react";
import { TrashIcon } from "../icons/TrashIcon";
import { PlusIcon } from "../icons/PlusIcon";

// =================== SHARED ===================

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
const UNIT_PRICES_INIT = [
  {
    id: 1,
    name: "Site clearance and grubbing",
    unit: "m²",
    price: 42,
  },
  {
    id: 2,
    name: "Earthworks - cut to fill",
    unit: "m³",
    price: 187,
  },
  {
    id: 3,
    name: "Crushed-stone base course",
    unit: "m³",
    price: 415,
  },
  {
    id: 4,
    name: "Internal access roads - DBM 60mm",
    unit: "m²",
    price: 348,
  },
  {
    id: 5,
    name: "Drainage culverts - RC 600",
    unit: "lm",
    price: 1240,
  },
  {
    id: 6,
    name: "Perimeter fencing - galvanized 2.4m",
    unit: "lm",
    price: 685,
  },
];

const UnitPricesSection = () => {
  const [rows, setRows] = useState(UNIT_PRICES_INIT);

  return (
    <div className="mb-8 bg-bg-cards1 p-4 rounded shadow">
      {/* Header */}
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
        <AddBtn label="Add Item" onClick={() => {}} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[460px] overflow-hidden">
          {/* Head */}
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
          {/* Rows */}
          {rows.map((row) => (
            <div
              key={row.id}
              className={`grid grid-cols-[1fr_80px_160px_44px] px-4 py-4 items-center
                border-t border-gray-100 transition-colors
                `}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[13.5px] text-text-primary truncate">
                  {row.name}
                </span>
              </div>
              <span className="text-[13.5px] text-text-secondary">
                {row.unit}
              </span>
              <span className="text-[13.5px] text-text-primary font-medium text-right pr-4">
                {row.price}
              </span>
              <button
                onClick={() => setRows((p) => p.filter((r) => r.id !== row.id))}
                className="flex justify-center text-text-secondary hover:text-status-risk transition-colors"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =================== PAYMENT SCHEDULE ===================
const PAYMENTS_INIT = [
  {
    id: 1,
    date: "15 May 2026",
    amount: 2890000,
    type: "Advance",
  },
  { id: 2, date: "30 Jun 2026", amount: 5780000, type: "IPC" },
  { id: 3, date: "31 Jul 2026", amount: 5780000, type: "IPC" },
  { id: 4, date: "31 Aug 2026", amount: 5780000, type: "IPC" },
  {
    id: 5,
    date: "30 Sept 2026",
    amount: 5780000,
    type: "IPC",
  },
  {
    id: 6,
    date: "30 Oct 2026",
    amount: 2890000,
    type: "Retention Release",
  },
];

const PaymentScheduleSection = () => {
  const [payments, setPayments] = useState(PAYMENTS_INIT);
  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="bg-bg-cards1 p-4 rounded shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[17px] font-medium text-text-primary">
            Payment Schedule
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {payments.length} installments · Total {total.toLocaleString()} EGP
          </p>
        </div>
        <AddBtn label="Add Installment" onClick={() => {}} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[460px] overflow-hidden">
          {/* Head */}
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
          {/* Rows */}
          {payments.map((p) => (
            <div
              key={p.id}
              className={`grid grid-cols-[1fr_170px_170px_44px] px-4 py-4 items-center
                border-t border-gray-100 transition-colors
                `}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[13.5px] text-text-primary">
                  {p.date}
                </span>
              </div>
              <span className="text-[13.5px] text-text-primary font-medium">
                {p.amount.toLocaleString()}
              </span>
              <span className="text-[13.5px] text-text-secondary">
                {p.type}
              </span>
              <button
                onClick={() =>
                  setPayments((prev) => prev.filter((r) => r.id !== p.id))
                }
                className="flex justify-center text-text-secondary hover:text-status-risk transition-colors"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =================== EXPORT ===================
const FinancialTermsSection = () => (
  <div className="bg-bg-main">
    <UnitPricesSection />
    <PaymentScheduleSection />
  </div>
);

export default FinancialTermsSection;
