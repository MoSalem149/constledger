// Auth routes: login (public), logout and me (protected)
const { Router } = require('express');
const { login, logout, me } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = Router();

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

module.exports = router;