import { Router } from "express";

import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  confirmFinancePlan,
  exportFinancePlan,
  generateFinancePlan,
  getFinancePlan,
  getPaymentSchedule,
  updateFinancePlan,
} from "../controllers/planningController.js";

const router = Router();

// All finance endpoints require authentication. Mutating endpoints additionally
// require contract_manager or pmo role; read endpoints are open to all auth'd users.
router.use(protect);

// Generate (or regenerate) a finance plan for a contract
router.post(
  "/:contractId/plans/generate",
  authorize("contract_manager", "pmo"),
  generateFinancePlan,
);

// Read or manually update the plan periods
router
  .route("/:contractId/plan")
  .get(getFinancePlan)
  .put(authorize("contract_manager", "pmo"), updateFinancePlan);

// Move plan from draft -> confirmed (required before reporting)
router.post(
  "/:contractId/plan/confirm",
  authorize("contract_manager", "pmo"),
  confirmFinancePlan,
);

// Payment schedule view + XLSX export
router.get("/:contractId/payment-schedule", getPaymentSchedule);
router.get(
  "/:contractId/plan/export",
  authorize("contract_manager", "pmo"),
  exportFinancePlan,
);

export default router;
