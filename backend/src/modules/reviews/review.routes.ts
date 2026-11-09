import { Router } from 'express';
import { z } from 'zod';
import { reviewController } from './review.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { authorize } from '../../middleware/authorize.js';
import { UserRole } from '../../types/index.js';

const router = Router();

const createReviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking identifier is required'),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

router.post('/', authenticate, authorize([UserRole.DRIVER]), validate(createReviewSchema), reviewController.create);
router.get('/parking/:parkingId', reviewController.getByParking);

export const reviewRoutes = router;
