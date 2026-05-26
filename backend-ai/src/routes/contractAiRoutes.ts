import { Router } from 'express';
import { internalOnly } from '../middleware/internalAuth';
import { analyzeContract } from '../controllers/contractAiController';

const router = Router();
router.post('/:contractId/analyze', internalOnly, analyzeContract);
export default router;
