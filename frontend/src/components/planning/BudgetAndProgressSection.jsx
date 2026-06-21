import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { financeService } from "../../services/financeService";
import ArrowLeftIcon from "../icons/ArrowLeftIcon";
import PlanningStrategyPicker from "./PlanningStrategyPicker";
import PlanningPlanView from "./PlanningPlanView";

export const BudgetAndProgressSection = ({ contractData }) => {
  const { user } = useAuth();
  const [state, setState] = useState("loading"); // loading | no_plan | picking | plan_draft | plan_confirmed | error
  const [planData, setPlanData] = useState(null);
  const [error, setError] = useState(null);

  const canPlan = ["contract_manager", "pmo"].includes(user?.role);
  const isActive = contractData?.status === "active";

  const fetchPlan = useCallback(async () => {
    if (!contractData?._id && !contractData?.id) return;
    try {
      setState("loading");
      setError(null);
      const data = await financeService.getPlan(
        contractData._id || contractData.id,
      );
      if (data?.plan?.status === "confirmed") {
        setPlanData(data);
        setState("plan_confirmed");
      } else if (data?.plan?.status === "draft") {
        setPlanData(data);
        setState("plan_draft");
      } else {
        setState("no_plan");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setState("no_plan");
      } else {
        setError(err.response?.data?.message || "Failed to load plan");
        setState("error");
      }
    }
  }, [contractData]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleGenerate = async (strategy) => {
    try {
      setState("loading");
      const data = await financeService.generatePlan(
        contractData._id || contractData.id,
        strategy,
        {},
      );
      setPlanData(data);
      setState("plan_draft");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate plan");
      setState("error");
    }
  };

  const handleUpdate = async (periods) => {
    try {
      const data = await financeService.updatePlan(
        contractData._id || contractData.id,
        periods,
      );
      setPlanData(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update plan");
      throw err;
    }
  };

  const handleConfirm = async () => {
    try {
      setState("loading");
      const data = await financeService.confirmPlan(
        contractData._id || contractData.id,
      );
      setPlanData((prev) => ({
        ...prev,
        plan: data.plan,
        periods: prev?.periods || [],
        kpis: prev?.kpis || {},
        warnings: prev?.warnings || [],
      }));
      setState("plan_confirmed");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to confirm plan");
      setState("error");
    }
  };

  const handleRegenerate = () => {
    setPlanData(null);
    setState("picking");
  };

  const handleExport = async () => {
    try {
      await financeService.exportPlan(contractData._id || contractData.id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to export plan");
    }
  };

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-text-secondary text-sm">Loading plan...</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <p className="text-status-risk text-sm">{error}</p>
        <button
          onClick={fetchPlan}
          className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <p className="text-text-primary font-medium mb-1">
            Contract Not Active
          </p>
          <p className="text-text-secondary text-sm">
            Confirm the contract first to start planning.
          </p>
        </div>
      </div>
    );
  }

  if (state === "no_plan" || state === "picking") {
    return (
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-[11px] text-text-placeholder tracking-widest mb-4">
              {contractData?.contractNumber} · FINANCE
            </p>
            <h2 className="text-2xl font-medium text-text-primary mb-4">
              Project Plan
            </h2>
            <p className="text-xs text-text-secondary">
              No plan generated yet. Pick an allocation strategy to forecast the
              contract value
            </p>
          </div>
        </div>

        <PlanningStrategyPicker
          onSelect={handleGenerate}
          loading={state === "loading"}
          canPlan={canPlan}
        />
      </div>
    );
  }

  return (
    <PlanningPlanView
      contractData={contractData}
      planData={planData}
      status={state === "plan_confirmed" ? "confirmed" : "draft"}
      canPlan={canPlan}
      onUpdate={handleUpdate}
      onConfirm={handleConfirm}
      onRegenerate={handleRegenerate}
      onExport={handleExport}
    />
  );
};