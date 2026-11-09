import { Router } from 'express';
import { bookingController } from './booking.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createBookingValidationSchema,
  cancelBookingValidationSchema,
  updateBookingStatusValidationSchema,
} from './booking.validation.js';
import { UserRole } from '../../types/index.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize([UserRole.DRIVER]),
  validate(createBookingValidationSchema),
  bookingController.create
);

router.get('/driver/:driverId', authorize([UserRole.DRIVER, UserRole.ADMIN]), bookingController.getDriverBookings);
router.get('/owner/:ownerId', authorize([UserRole.OWNER, UserRole.ADMIN]), bookingController.getOwnerBookings);
router.get('/admin/all', authorize([UserRole.ADMIN]), bookingController.getAllBookings);
router.get('/:bookingId', bookingController.getById);

router.post(
  '/:bookingId/cancel',
  authorize([UserRole.DRIVER]),
  validate(cancelBookingValidationSchema),
  bookingController.cancel
);

router.patch(
  '/:bookingId/status',
  authorize([UserRole.OWNER, UserRole.ADMIN]),
  validate(updateBookingStatusValidationSchema),
  bookingController.updateStatus
);

export const bookingRoutes = router;
