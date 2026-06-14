import { useState, useContext } from "react";
import { ContractContext } from "../../context/EditContaractContext";
import { PlusIcon } from "../icons/PlusIcon";
import { TrashIcon } from "../icons/TrashIcon";

// ... icons كما هي

const ClauseCard = ({ status, condition, penalty, onRemove, onChange }) => {
  const [local, setLocal] = useState({ condition, penalty });

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden bg-bg-main">
      <div className="relative p-4 pr-12">
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 text-text-secondary hover:text-status-risk transition-colors"
        >
          <TrashIcon />
        </button>

        {/* CONDITION */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8 gap-1 mb-3">
          <div className="flex items-center gap-2 sm:w-44 flex-shrink-0">
            <span className="text-[10.5px] font-semibold text-text-secondary tracking-widest uppercase">
              Condition
            </span>
          </div>
          <input
            value={local.condition}
            onChange={(e) =>
              setLocal((p) => ({ ...p, condition: e.target.value }))
            }
            onBlur={() =>
              onChange({ condition: local.condition, penalty: local.penalty })
            }
            className="text-[13.5px] text-text-primary pl-4 sm:pl-0 bg-transparent border-b border-transparent
              focus:border-gray-300 outline-none w-full transition-colors"
          />
        </div>

        {/* PENALTY */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8 gap-1">
          <div className="sm:w-44 flex-shrink-0 pl-4 sm:pl-0">
            <span className="text-[10.5px] font-semibold text-text-secondary tracking-widest uppercase">
              Penalty / Formula
            </span>
          </div>
          <input
            value={local.penalty}
            onChange={(e) =>
              setLocal((p) => ({ ...p, penalty: e.target.value }))
            }
            onBlur={() =>
              onChange({ condition: local.condition, penalty: local.penalty })
            }
            className="text-[13.5px] text-text-secondary pl-4 sm:pl-0 bg-transparent border-b border-transparent
              focus:border-gray-300 outline-none w-full transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

const PenaltiesSection = ({ data }) => {
  const { changeData } = useContext(ContractContext);

  const [clauses, setClauses] = useState(
    (data.penalties ?? []).map((p, i) => ({ id: i + 1, ...p })),
  );

  const syncToContext = (updated) => {
    changeData({
      penalties: updated.map(({ id, ...rest }) => rest),
    });
  };

  const handleChange = (id, newFields) => {
    const updated = clauses.map((c) =>
      c.id === id ? { ...c, ...newFields } : c,
    );
    setClauses(updated);
    syncToContext(updated);
  };

  const handleRemove = (id) => {
    const updated = clauses.filter((c) => c.id !== id);
    setClauses(updated);
    syncToContext(updated);
  };

  const handleAdd = () => {
    const newClause = { id: Date.now(), condition: "", penalty: "" };
    const updated = [...clauses, newClause];
    setClauses(updated);
    syncToContext(updated);
  };

  return (
    <div className="bg-bg-cards1 p-4 shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[17px] font-medium text-text-primary">
            Penalty Clauses
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {clauses.length} clauses extracted from §8 Liabilities &amp; Damages
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 shadow rounded-full
            text-[13px] text-text-primary bg-bg-cards1 hover:bg-gray-100 transition-colors
            self-start whitespace-nowrap"
        >
          <PlusIcon /> Add Clause
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {clauses.map((c) => (
          <ClauseCard
            key={c.id}
            {...c}
            onRemove={() => handleRemove(c.id)}
            onChange={(fields) => handleChange(c.id, fields)}
          />
        ))}
      </div>
    </div>
  );
};

export default PenaltiesSection;
