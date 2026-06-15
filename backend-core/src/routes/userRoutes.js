// User routes: all endpoints require a valid JWT and pmo role
const { Router } = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { createUser, listUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');

const router = Router();

router.use(protect, authorize('pmo'));

router.route('/').post(createUser).get(listUsers);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;