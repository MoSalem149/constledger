import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { createUser, listUsers, getUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = Router();

// All user-management endpoints require a valid token AND the pmo role.
router.use(protect, authorize('pmo'));

router.route('/').post(createUser).get(listUsers);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

export default router;
