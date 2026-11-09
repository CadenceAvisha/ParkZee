import apiClient from './api';
import { ConfirmPaymentRequest, PaymentConfirmationRecord } from '../types/payment.types';
import { Booking } from '../types/booking.types';

export const paymentService = {
  confirmDirectPayment: async (
    ownerId: string,
    ownerName: string,
    req: ConfirmPaymentRequest
  ): Promise<{ booking: Booking; paymentRecord: PaymentConfirmationRecord }> => {
    try {
      const response = await apiClient.post<any>('/payments/confirm-direct', {
        ...req,
        ownerId,
        ownerName,
      });
      return {
        booking: response.data?.booking ?? response.data?.data?.booking ?? response.data,
        paymentRecord:
          response.data?.paymentRecord ?? response.data?.data?.paymentRecord ?? response.data,
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Payment confirmation failed';
      throw new Error(msg);
    }
  },

  getPaymentHistory: async (ownerId?: string): Promise<PaymentConfirmationRecord[]> => {
    try {
      const response = await apiClient.get<any>('/payments/history', {
        params: { ownerId },
      });
      return response.data?.data ?? response.data ?? [];
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch payment history';
      throw new Error(msg);
    }
  },
};
