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
// require contract_manager role; read and export endpoints are open to
// contract_manager and top_management.
router.use(protect);

// Generate (or regenerate) a finance plan for a contract
router.post(
  "/:contractId/plans/generate",
  authorize("contract_manager"),
  generateFinancePlan,
);

// Read or manually update the plan periods
router
  .route("/:contractId/plan")
  .get(getFinancePlan)
  .put(authorize("contract_manager"), updateFinancePlan);

// Move plan from draft -> confirmed (required before reporting)
router.post(
  "/:contractId/plan/confirm",
  authorize("contract_manager"),
  confirmFinancePlan,
);

// Payment schedule view + XLSX export
router.get("/:contractId/payment-schedule", getPaymentSchedule);
router.get(
  "/:contractId/plan/export",
  authorize("contract_manager", "top_management"),
  exportFinancePlan,
);

export default router;