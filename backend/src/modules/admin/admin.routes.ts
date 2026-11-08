import { Router } from 'express';
import { z } from 'zod';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { UserRole, AccountStatus } from '../../types/index.js';

const router = Router();

router.use(authenticate);
router.use(authorize([UserRole.ADMIN]));

const updateUserStatusSchema = z.object({
  status: z.enum([AccountStatus.ACTIVE, AccountStatus.SUSPENDED, AccountStatus.PENDING]),
});

const resolveReportSchema = z.object({
  status: z.enum(['pending', 'in_review', 'resolved', 'dismissed']),
  resolutionNotes: z.string().min(2, 'Resolution notes are required'),
});

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/status', validate(updateUserStatusSchema), adminController.updateUserStatus);
router.get('/reports', adminController.getReports);
router.patch('/reports/:reportId/resolve', validate(resolveReportSchema), adminController.resolveReport);

export const adminRoutes = router;
