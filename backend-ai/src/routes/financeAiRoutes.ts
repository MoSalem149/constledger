import { Router } from 'express';
import { internalOnly } from '../middleware/internalAuth';
const router = Router();
// Placeholder — add AI finance forecasting endpoints here
router.get('/health', internalOnly, (_req, res) => res.json({ module: 'finance-ai', status: 'ready' }));
export default router;
