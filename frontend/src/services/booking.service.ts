import apiClient from './api';
import { Booking, BookingStatus, CreateBookingRequest } from '../types/booking.types';
import { getStoredBookings, saveStoredBookings, getStoredParkingLocations, saveStoredParkingLocations } from './storage';

export const bookingService = {
  createBooking: async (
    driverId: string,
    driverName: string,
    driverPhone: string,
    driverEmail: string,
    req: CreateBookingRequest
  ): Promise<Booking> => {
    try {
      const response = await apiClient.post<Booking>('/bookings', {
        driverId,
        ...req,
      });
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, processing reservation locally', err);
      const locations = getStoredParkingLocations();
      const location = locations.find((l) => l.id === req.parkingLocationId);
      if (!location) throw new Error('Selected parking location not found');

      // Check capacity
      if (location.availableCapacity <= 0) {
        throw new Error('Sorry, no parking capacity is available for the selected slot.');
      }

      // Check conflict overlap
      const bookings = getStoredBookings();
      const reqStart = new Date(req.startTime).getTime();
      const reqEnd = new Date(req.endTime).getTime();

      const overlappingBookings = bookings.filter((b) => {
        if (b.parkingLocationId !== req.parkingLocationId) return false;
        if (['CANCELLED', 'EXPIRED'].includes(b.bookingStatus)) return false;
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        return reqStart < bEnd && reqEnd > bStart;
      });

      if (overlappingBookings.length >= location.totalCapacity) {
        throw new Error('All slots are booked for the requested time interval. Please choose different arrival/departure times.');
      }

      const durationHours = Math.max(1, Math.ceil((reqEnd - reqStart) / (1000 * 60 * 60)));
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);

      const newBooking: Booking = {
        id: `bk-${Date.now()}`,
        bookingReference: `PKZ-2026-${randomSuffix}`,
        driverId,
        driverName,
        driverPhone,
        driverEmail,
        parkingLocationId: location.id,
        parkingName: location.name,
        parkingAddress: location.address,
        parkingCoordinates: location.location,
        vehicleDetails: req.vehicleDetails,
        startTime: req.startTime,
        endTime: req.endTime,
        durationHours,
        pricePerHour: location.pricePerHour,
        totalAmount: req.totalAmount || durationHours * location.pricePerHour,
        // Crucial Business Rule: No upfront payment, QR NOT yet issued
        bookingStatus: 'RESERVED_AWAITING_OWNER_CONFIRMATION',
        paymentStatus: 'NOT_PAID',
        createdAt: new Date().toISOString(),
      };

      // Decrement available capacity
      location.availableCapacity = Math.max(0, location.availableCapacity - 1);
      saveStoredParkingLocations(locations);

      bookings.unshift(newBooking);
      saveStoredBookings(bookings);
      return newBooking;
    }
  },

  getDriverBookings: async (driverId: string): Promise<Booking[]> => {
    try {
      const response = await apiClient.get<Booking[]>(`/bookings/driver/${driverId}`);
      return response.data;
    } catch (err) {
      const bookings = getStoredBookings();
      return bookings.filter((b) => b.driverId === driverId);
    }
  },

  getOwnerBookings: async (ownerId: string): Promise<Booking[]> => {
    try {
      const response = await apiClient.get<Booking[]>(`/bookings/owner/${ownerId}`);
      return response.data;
    } catch (err) {
      const locations = getStoredParkingLocations().filter((l) => l.ownerId === ownerId);
      const locationIds = locations.map((l) => l.id);
      const bookings = getStoredBookings();
      return bookings.filter((b) => locationIds.includes(b.parkingLocationId));
    }
  },

  getAllBookings: async (): Promise<Booking[]> => {
    try {
      const response = await apiClient.get<Booking[]>('/bookings/admin/all');
      return response.data;
    } catch (err) {
      return getStoredBookings();
    }
  },

  getBookingById: async (bookingId: string): Promise<Booking | null> => {
    try {
      const response = await apiClient.get<Booking>(`/bookings/${bookingId}`);
      return response.data;
    } catch (err) {
      const bookings = getStoredBookings();
      return bookings.find((b) => b.id === bookingId) || null;
    }
  },

  cancelBooking: async (bookingId: string, reason?: string): Promise<Booking> => {
    try {
      const response = await apiClient.post<Booking>(`/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (err) {
      const bookings = getStoredBookings();
      const idx = bookings.findIndex((b) => b.id === bookingId);
      if (idx === -1) throw new Error('Booking not found');

      bookings[idx].bookingStatus = 'CANCELLED';
      bookings[idx].cancellationReason = reason || 'Cancelled by user';

      // Restore capacity
      const locations = getStoredParkingLocations();
      const loc = locations.find((l) => l.id === bookings[idx].parkingLocationId);
      if (loc) {
        loc.availableCapacity = Math.min(loc.totalCapacity, loc.availableCapacity + 1);
        saveStoredParkingLocations(locations);
      }

      saveStoredBookings(bookings);
      return bookings[idx];
    }
  },

  updateBookingStatus: async (bookingId: string, status: BookingStatus): Promise<Booking> => {
    try {
      const response = await apiClient.patch<Booking>(`/bookings/${bookingId}/status`, { status });
      return response.data;
    } catch (err) {
      const bookings = getStoredBookings();
      const idx = bookings.findIndex((b) => b.id === bookingId);
      if (idx === -1) throw new Error('Booking not found');
      bookings[idx].bookingStatus = status;
      saveStoredBookings(bookings);
      return bookings[idx];
    }
  },
};
