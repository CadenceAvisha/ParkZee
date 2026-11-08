import apiClient from './api';
import { ConfirmPaymentRequest, PaymentConfirmationRecord } from '../types/payment.types';
import { Booking } from '../types/booking.types';
import { getStoredBookings, saveStoredBookings, getStoredPayments, saveStoredPayments } from './storage';

export const paymentService = {
  confirmDirectPayment: async (
    ownerId: string,
    ownerName: string,
    req: ConfirmPaymentRequest
  ): Promise<{ booking: Booking; paymentRecord: PaymentConfirmationRecord }> => {
    try {
      const response = await apiClient.post<{ booking: Booking; paymentRecord: PaymentConfirmationRecord }>(
        `/payments/confirm-direct`,
        { ...req, ownerId }
      );
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, confirming direct payment locally', err);
      const bookings = getStoredBookings();
      const bookingIdx = bookings.findIndex((b) => b.id === req.bookingId);
      if (bookingIdx === -1) {
        throw new Error('Booking record not found for payment confirmation.');
      }

      const booking = bookings[bookingIdx];
      if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'EXPIRED') {
        throw new Error(`Cannot confirm payment for a booking with status ${booking.bookingStatus}`);
      }

      const confirmedAt = new Date().toISOString();
      const secureToken = `PKZ-SEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`;

      // Update booking
      booking.paymentStatus = 'PAID_CONFIRMED_BY_OWNER';
      booking.bookingStatus = 'CONFIRMED';
      booking.paymentMethod = req.paymentMethod;
      booking.paymentConfirmedBy = ownerName || ownerId;
      booking.paymentConfirmedAt = confirmedAt;
      booking.paymentNotes = req.notes;
      booking.verificationToken = secureToken;

      bookings[bookingIdx] = booking;
      saveStoredBookings(bookings);

      // Create Payment Confirmation Audit Record
      const paymentRecord: PaymentConfirmationRecord = {
        id: `pay-${Date.now()}`,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        driverId: booking.driverId,
        driverName: booking.driverName,
        ownerId,
        ownerName,
        amount: req.amountReceived,
        currency: 'INR',
        paymentMethod: req.paymentMethod,
        paymentStatus: 'PAID_CONFIRMED_BY_OWNER',
        confirmedAt,
        notes: req.notes,
      };

      const payments = getStoredPayments();
      payments.unshift(paymentRecord);
      saveStoredPayments(payments);

      return { booking, paymentRecord };
    }
  },

  getPaymentHistory: async (ownerId?: string): Promise<PaymentConfirmationRecord[]> => {
    try {
      const response = await apiClient.get<PaymentConfirmationRecord[]>('/payments/history', {
        params: { ownerId },
      });
      return response.data;
    } catch (err) {
      const payments = getStoredPayments();
      if (ownerId) {
        return payments.filter((p) => p.ownerId === ownerId);
      }
      return payments;
    }
  },
};
