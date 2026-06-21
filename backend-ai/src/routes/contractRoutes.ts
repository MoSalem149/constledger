import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { authorize } from '../middleware/authorize';
import * as c from '../controllers/contractController';

const router = Router();

// Every contracts endpoint requires a valid JWT. Mutations additionally
// require the contract_manager or pmo role.
router.use(jwtAuth);

router.get('/', c.listContracts);
router.post('/upload', authorize('contract_manager', 'pmo'), c.uploadContract);
router.post('/:id/analyze', authorize('contract_manager', 'pmo'), c.reanalyzeContract);
router.route('/:id')
  .get(c.getContract)
  .put(authorize('contract_manager', 'pmo'), c.updateContract)
  // Delete is intentionally contract_manager ONLY — not 'pmo' like the
  // other mutations on this route. Do not widen this without a product
  // decision to do so.
  .delete(authorize('contract_manager'), c.deleteContract);

export default router;