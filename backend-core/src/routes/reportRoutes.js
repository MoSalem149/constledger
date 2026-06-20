import { Router } from "express";

import {
  allContractsReport,
  exportAllContractsReport,
  exportPaymentScheduleReport,
  exportPlannedBudgetReport,
  exportProjectSummaryReport,
  paymentScheduleReport,
  plannedBudgetReport,
  projectSummaryReport,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// All report endpoints are read-only and require authentication. They operate
// against confirmed plans only — see reportingService.assertConfirmedReportPlan.
router.use(protect);

router.get("/contracts", allContractsReport);
router.get("/contracts/export", exportAllContractsReport);
router.get("/planned-budget", plannedBudgetReport);
router.get("/planned-budget/export", exportPlannedBudgetReport);
router.get("/payment-schedule", paymentScheduleReport);
router.get("/payment-schedule/export", exportPaymentScheduleReport);
router.get("/project/:id/summary", projectSummaryReport);
router.get("/project/:id/summary/export", exportProjectSummaryReport);

export default router;
