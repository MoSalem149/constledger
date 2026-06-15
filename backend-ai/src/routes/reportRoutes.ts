import { Router } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import * as c from '../controllers/reportController';

const router = Router();

router.use(jwtAuth);

router.get('/contracts', c.allContractsReport);
router.get('/monthly', c.monthlyReport);
router.get('/quarterly', c.quarterlyReport);
router.get('/project/:id/performance', c.projectPerformanceReport);
router.get('/penalties', c.penaltiesReport);
router.post('/export', c.exportReport);

export default router;
