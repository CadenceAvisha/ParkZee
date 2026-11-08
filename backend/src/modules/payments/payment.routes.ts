import { Router } from 'express';
import { z } from 'zod';
import { paymentController } from './payment.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { UserRole, PaymentMethod } from '../../types/index.js';

const router = Router();

router.use(authenticate);

const confirmPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking identifier is required'),
  amountReceived: z.coerce.number().positive('Amount received must be positive'),
  paymentMethod: z.enum([
    PaymentMethod.CASH,
    PaymentMethod.UPI,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.OTHER,
  ]),
  notes: z.string().max(500).optional(),
});

router.post(
  '/confirm-direct',
  authorize([UserRole.OWNER, UserRole.ADMIN]),
  validate(confirmPaymentSchema),
  paymentController.confirmDirectPayment
);

router.get('/history', paymentController.getHistory);

export const paymentRoutes = router;
