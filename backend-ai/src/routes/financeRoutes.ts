import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { authorize } from '../middleware/authorize';
import * as c from '../controllers/financeController';

const router = Router();

router.use(jwtAuth);

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
