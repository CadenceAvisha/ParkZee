import { z } from 'zod';

export const confirmDirectPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'other'], {
    message: 'Please select the payment method received',
  }),
  amountReceived: z.number().min(1, 'Amount received must be greater than 0'),
  notes: z.string().max(250, 'Notes cannot exceed 250 characters').optional(),
  confirmedByOwner: z.literal(true, {
    message: 'You must check the box to confirm you have physically or digitally received the payment from the driver.',
  }),
});

export type ConfirmDirectPaymentFormData = z.infer<typeof confirmDirectPaymentSchema>;
