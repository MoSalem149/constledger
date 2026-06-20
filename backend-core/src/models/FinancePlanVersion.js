import mongoose from "mongoose";

// FinancePlanVersion — audit / rollback history. A snapshot is written every
// time an existing plan is regenerated or manually edited (see
// planningController.snapshotExistingPlan). versionNumber increments per planId.
const financePlanVersionSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinancePlan",
      required: true,
      index: true,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      index: true,
    },
    versionNumber: { type: Number, required: true },
    // Mixed — stores the full prior plan + periods as JSON for easy restoration
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    replacedAt: { type: Date, required: true, default: Date.now },
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "finance_plan_versions",
  },
);

// Latest-first lookup of versions for a plan
financePlanVersionSchema.index({ planId: 1, versionNumber: -1 });

export default mongoose.model("FinancePlanVersion", financePlanVersionSchema);
