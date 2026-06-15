// Auth routes: login (public), logout and me (protected)
import { Router } from 'express';
import { login, logout, me } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

export default router;