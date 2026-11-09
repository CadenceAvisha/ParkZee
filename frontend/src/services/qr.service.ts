import apiClient from './api';
import { QRScanVerificationResult } from '../types/payment.types';
import { Booking } from '../types/booking.types';

export const qrService = {
  verifyQRToken: async (
    token: string,
    ownerParkingId?: string
  ): Promise<QRScanVerificationResult> => {
    try {
      const response = await apiClient.post<QRScanVerificationResult>('/qr/verify', {
        token,
        ownerParkingId,
      });
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'QR token verification failed';
      return {
        valid: false,
        message: msg,
      };
    }
  },

  recordCheckIn: async (bookingId: string): Promise<Booking> => {
    try {
      const response = await apiClient.post<any>('/qr/check-in', { bookingId });
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Check-in failed';
      throw new Error(msg);
    }
  },

  recordCheckOut: async (bookingId: string): Promise<Booking> => {
    try {
      const response = await apiClient.post<any>('/qr/check-out', { bookingId });
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Check-out failed';
      throw new Error(msg);
    }
  },
};
