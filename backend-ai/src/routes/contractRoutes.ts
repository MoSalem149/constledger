import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { authorize } from '../middleware/authorize';
import * as c from '../controllers/contractController';

const router = Router();

// Every contracts endpoint requires a valid JWT. Mutations require the
// contract_manager role; reads are open to all authenticated users.
router.use(jwtAuth);

router.get('/', c.listContracts);
router.post('/upload', authorize('contract_manager'), c.uploadContract);
router.post('/:id/analyze', authorize('contract_manager'), c.reanalyzeContract);
router.route('/:id')
  .get(c.getContract)
  .put(authorize('contract_manager'), c.updateContract)
  .delete(authorize('contract_manager'), c.deleteContract);

export default router;