import { Router } from 'express';
import { z } from 'zod';
import { reportController } from './report.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../types/index.js';

const router = Router();

router.use(authenticate);

const createReportSchema = z.object({
  targetType: z.enum(['parking_location', 'booking', 'user', 'payment_dispute']),
  targetId: z.string().min(1, 'Target ID is required'),
  targetTitle: z.string().min(1, 'Target title is required'),
  reason: z.string().min(3, 'Reason is required'),
  description: z.string().min(5, 'Description is required'),
});

const resolveReportSchema = z.object({
  status: z.enum(['pending', 'in_review', 'resolved', 'dismissed']),
  resolutionNotes: z.string().min(2, 'Resolution notes are required'),
});

router.post('/', validate(createReportSchema), reportController.create);
router.get('/', authorize([UserRole.ADMIN]), reportController.getAll);
router.patch(
  '/:reportId/resolve',
  authorize([UserRole.ADMIN]),
  validate(resolveReportSchema),
  reportController.resolve
);

export const reportRoutes = router;
