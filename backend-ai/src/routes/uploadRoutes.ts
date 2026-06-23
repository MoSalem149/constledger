import { Router } from 'express';

import { completeUpload, signUpload } from '../controllers/uploadController';
import { authorize } from '../middleware/authorize';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

// Both upload endpoints require authentication AND contract_manager role.
router.use(jwtAuth);
router.post('/sign', authorize('contract_manager'), signUpload);
router.post('/complete', authorize('contract_manager'), completeUpload);

export default router;