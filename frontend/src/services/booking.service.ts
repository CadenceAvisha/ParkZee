import apiClient from './api';
import { Booking, BookingStatus, CreateBookingRequest } from '../types/booking.types';

export const bookingService = {
  createBooking: async (
    driverId: string,
    driverName: string,
    driverPhone: string,
    driverEmail: string,
    req: CreateBookingRequest
  ): Promise<Booking> => {
    try {
      const response = await apiClient.post<any>('/bookings', {
        driverId,
        driverName,
        driverPhone,
        driverEmail,
        ...req,
      });
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create booking';
      throw new Error(msg);
    }
  },

  getDriverBookings: async (driverId: string): Promise<Booking[]> => {
    try {
      const response = await apiClient.get<any>(`/bookings/driver/${driverId}`);
      return response.data?.data ?? response.data ?? [];
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch driver bookings';
      throw new Error(msg);
    }
  },

  getOwnerBookings: async (ownerId: string): Promise<Booking[]> => {
    try {
      const response = await apiClient.get<any>(`/bookings/owner/${ownerId}`);
      return response.data?.data ?? response.data ?? [];
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch owner bookings';
      throw new Error(msg);
    }
  },

  getAllBookings: async (): Promise<Booking[]> => {
    try {
      const response = await apiClient.get<any>('/bookings/admin/all');
      return response.data?.data ?? response.data ?? [];
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch all bookings';
      throw new Error(msg);
    }
  },

  getBookingById: async (bookingId: string): Promise<Booking | null> => {
    try {
      const response = await apiClient.get<any>(`/bookings/${bookingId}`);
      return response.data?.data ?? response.data ?? null;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Booking not found';
      throw new Error(msg);
    }
  },

  cancelBooking: async (bookingId: string, reason?: string): Promise<Booking> => {
    try {
      const response = await apiClient.post<any>(`/bookings/${bookingId}/cancel`, { reason });
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel booking';
      throw new Error(msg);
    }
  },

  updateBookingStatus: async (bookingId: string, status: BookingStatus): Promise<Booking> => {
    try {
      const response = await apiClient.patch<any>(`/bookings/${bookingId}/status`, { status });
      return response.data?.data ?? response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update booking status';
      throw new Error(msg);
    }
  },
};
