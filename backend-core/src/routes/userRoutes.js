const { Router } = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const router = Router();
router.use(protect, authorize('pmo'));
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (err) { next(err); }
});
module.exports = router;
