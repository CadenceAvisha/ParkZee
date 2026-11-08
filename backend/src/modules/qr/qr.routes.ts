import { Router } from 'express';
import { z } from 'zod';
import { qrController } from './qr.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../types/index.js';

const router = Router();

router.use(authenticate);

const verifyQRSchema = z.object({
  token: z.string().min(1, 'Token is required for verification'),
  ownerParkingId: z.string().optional(),
});

const bookingActionSchema = z.object({
  bookingId: z.string().min(1, 'Booking identifier is required'),
});

router.post(
  '/verify',
  authorize([UserRole.OWNER, UserRole.ADMIN]),
  validate(verifyQRSchema),
  qrController.verify
);

router.post(
  '/check-in',
  authorize([UserRole.OWNER, UserRole.ADMIN]),
  validate(bookingActionSchema),
  qrController.checkIn
);

router.post(
  '/check-out',
  authorize([UserRole.OWNER, UserRole.ADMIN]),
  validate(bookingActionSchema),
  qrController.checkOut
);

export const qrRoutes = router;
