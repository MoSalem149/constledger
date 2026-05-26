import { Router } from 'express';
import { internalOnly } from '../middleware/internalAuth';
const router = Router();
// Placeholder — add AI performance/KPI analysis endpoints here
router.get('/health', internalOnly, (_req, res) => res.json({ module: 'performance-ai', status: 'ready' }));
export default router;
