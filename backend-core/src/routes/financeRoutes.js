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

router.use(protect);

router.post(
  "/:contractId/plans/generate",
  authorize("contract_manager", "pmo"),
  generateFinancePlan,
);
router
  .route("/:contractId/plan")
  .get(getFinancePlan)
  .put(authorize("contract_manager", "pmo"), updateFinancePlan);
router.post(
  "/:contractId/plan/confirm",
  authorize("contract_manager", "pmo"),
  confirmFinancePlan,
);
router.get("/:contractId/payment-schedule", getPaymentSchedule);
router.get(
  "/:contractId/plan/export",
  authorize("contract_manager", "pmo"),
  exportFinancePlan,
);

export default router;
