import { Router } from 'express';
import { userController } from './user.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { UserRole } from '../../types/index.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize([UserRole.ADMIN]), userController.getAllUsers);
router.patch('/profile', userController.updateProfile);
router.get('/:id', userController.getUserById);
router.patch('/:id/status', authorize([UserRole.ADMIN]), userController.updateUserStatus);

export const userRoutes = router;
