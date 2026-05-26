const { Router } = require('express');
const { protect } = require('../middleware/authMiddleware');
const c = require('../controllers/reportController');
const router = Router();
router.use(protect);
router.get('/contracts', c.allContractsReport);
router.get('/monthly', c.monthlyReport);
router.get('/performance/:projectId', c.projectPerformanceReport);
module.exports = router;
