import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { authorize } from '../middleware/authorize';
import * as c from '../controllers/financeController';
import * as planning from '../controllers/planningController';

const router = Router();

router.use(jwtAuth);

router.post(
  '/:contractId/plans/generate',
  authorize('contract_manager', 'pmo'),
  planning.generateFinancePlan,
);
router.route('/:contractId/plan')
  .get(planning.getFinancePlan)
  .put(authorize('contract_manager', 'pmo'), planning.updateFinancePlan);
router.post(
  '/:contractId/plan/confirm',
  authorize('contract_manager', 'pmo'),
  planning.confirmFinancePlan,
);
router.get('/:contractId/payment-schedule', planning.getPaymentSchedule);

router.route('/:contractId/planned')
  .get(c.getPlannedBudget)
  .put(authorize('pmo'), c.updatePlannedBudget);

router.route('/:contractId/actual')
  .get(c.listActualReports)
  .post(authorize('finance_team', 'pmo'), c.submitActualReport);

router.put('/:contractId/actual/:id', authorize('finance_team', 'pmo'), c.editActualReport);
router.post('/:contractId/actual/:id/approve', authorize('pmo'), c.approveReport);
router.post('/:contractId/actual/:id/reject', authorize('pmo'), c.rejectReport);
router.get('/:contractId/comparison', c.getComparison);

export default router;
