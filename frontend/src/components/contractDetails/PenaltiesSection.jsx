import { useState, useContext } from "react";
import { ContractContext } from "../../context/EditContaractContext";
import { PlusIcon } from "../icons/PlusIcon";
import { TrashIcon } from "../icons/TrashIcon";

const ClauseCard = ({
  condition,
  penalty,
  first_offense,
  second_offense,
  third_offense,
  onRemove,
  onChange,
  readOnly,
}) => {
  const [local, setLocal] = useState({
    condition: condition || "",
    penalty: penalty || "",
    first_offense: first_offense || "",
    second_offense: second_offense || "",
    third_offense: third_offense || "",
  });

  const handleFieldChange = (key, value) => {
    const updated = {
      ...local,
      [key]: value,
    };

    setLocal(updated);
  };

  const handleBlur = () => {
    onChange(local);
  };

  const renderInput = (
    label,
    key,
    value,
    textColor = "text-text-secondary",
  ) => (
    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8 gap-1">
      <div className="sm:w-44 flex-shrink-0 pl-4 sm:pl-0">
        <span className="text-[10.5px] font-semibold text-text-secondary tracking-widest uppercase">
          {label}
        </span>
      </div>

      <input
        value={value}
        onChange={
          readOnly ? undefined : (e) => handleFieldChange(key, e.target.value)
        }
        onBlur={readOnly ? undefined : handleBlur}
        readOnly={readOnly}
        className={`text-[13.5px] ${textColor} pl-4 sm:pl-0 bg-transparent border-b border-transparent
        outline-none w-full transition-colors ${
          readOnly ? "cursor-default" : "focus:border-gray-300"
        }`}
      />
    </div>
  );

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden bg-bg-main">
      <div className={`relative p-4 ${!readOnly ? "pr-12" : ""}`}>
        {!readOnly && (
          <button
            onClick={onRemove}
            className="absolute top-4 right-4 text-text-secondary hover:text-status-risk transition-colors"
          >
            <TrashIcon />
          </button>
        )}

        {/* CONDITION */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8 gap-1 mb-3">
          <div className="flex items-center gap-2 sm:w-44 flex-shrink-0">
            <span className="text-[10.5px] font-semibold text-text-secondary tracking-widest uppercase">
              Condition
            </span>
          </div>

          <textarea
            value={local.condition}
            onChange={
              readOnly
                ? undefined
                : (e) => handleFieldChange("condition", e.target.value)
            }
            onBlur={readOnly ? undefined : handleBlur}
            readOnly={readOnly}
            rows={3}
            className={`text-[13.5px] text-text-primary overflow-hidden pl-4 sm:pl-0 bg-transparent border-b border-transparent
            outline-none w-full resize-none transition-colors ${
              readOnly ? "cursor-default" : "focus:border-gray-300"
            }`}
          />
        </div>

        {/* PENALTY */}
        {local.penalty &&
          renderInput(
            "Penalty / Formula",
            "penalty",
            local.penalty,
            "text-text-primary",
          )}

        {/* FIRST OFFENSE */}

        {local.first_offense &&
          renderInput("First Offense", "first_offense", local.first_offense)}

        {/* SECOND OFFENSE */}
        {local.second_offense &&
          renderInput("Second Offense", "second_offense", local.second_offense)}

        {/* THIRD OFFENSE */}
        {local.third_offense &&
          renderInput("Third Offense", "third_offense", local.third_offense)}
      </div>
    </div>
  );
};

const PenaltiesSection = ({ data, readOnly }) => {
  const { changeData } = useContext(ContractContext);

  const [clauses, setClauses] = useState(
    (data.penalties ?? []).map((p, i) => ({
      id: i + 1,
      condition: p.condition || "",
      penalty: p.penalty || "",
      first_offense: p.first_offense || "",
      second_offense: p.second_offense || "",
      third_offense: p.third_offense || "",
    })),
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
    const newClause = {
      id: Date.now(),
      condition: "",
      penalty: "",
      first_offense: "",
      second_offense: "",
      third_offense: "",
    };

    const updated = [...clauses, newClause];

    setClauses(updated);
    syncToContext(updated);
  };

  return (
    <div className="bg-bg-cards1 p-4 shadow rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[17px] font-medium text-text-primary">
            Penalty Clauses
          </h2>

          <p className="text-xs text-text-secondary mt-0.5">
            {clauses.length} clauses extracted
          </p>
        </div>

        {!readOnly && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 shadow rounded-full
            text-[13px] text-text-primary bg-bg-cards1 hover:bg-gray-100 transition-colors
            self-start whitespace-nowrap"
          >
            <PlusIcon />
            Add Clause
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {clauses.map((c) => (
          <ClauseCard
            key={c.id}
            {...c}
            onRemove={() => handleRemove(c.id)}
            onChange={(fields) => handleChange(c.id, fields)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
};

export default PenaltiesSection;
