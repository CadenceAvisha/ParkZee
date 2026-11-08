import apiClient from './api';
import { QRScanVerificationResult } from '../types/payment.types';
import { Booking } from '../types/booking.types';
import { getStoredBookings, saveStoredBookings, getStoredParkingLocations, saveStoredParkingLocations } from './storage';

export const qrService = {
  verifyQRToken: async (token: string, ownerParkingId?: string): Promise<QRScanVerificationResult> => {
    try {
      const response = await apiClient.post<QRScanVerificationResult>('/qr/verify', {
        token,
        ownerParkingId,
      });
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, verifying QR token locally', err);
      const cleanToken = token.trim();
      const bookings = getStoredBookings();

      const booking = bookings.find(
        (b) =>
          b.verificationToken === cleanToken ||
          b.bookingReference.toLowerCase() === cleanToken.toLowerCase() ||
          b.id === cleanToken
      );

      if (!booking) {
        return {
          valid: false,
          message: 'Invalid or unknown QR code. No active reservation found matching this token.',
        };
      }

      if (ownerParkingId && booking.parkingLocationId !== ownerParkingId) {
        return {
          valid: false,
          message: `QR code belongs to a different parking facility (${booking.parkingName}). Not valid for this location.`,
        };
      }

      if (booking.bookingStatus === 'CANCELLED') {
        return {
          valid: false,
          message: 'Access Denied: This reservation was previously cancelled.',
        };
      }

      if (booking.bookingStatus === 'EXPIRED') {
        return {
          valid: false,
          message: 'Access Denied: This reservation has expired.',
        };
      }

      if (booking.paymentStatus !== 'PAID_CONFIRMED_BY_OWNER') {
        return {
          valid: false,
          message: 'Access Denied: Direct payment for this booking has not been confirmed yet.',
        };
      }

      if (booking.bookingStatus === 'COMPLETED') {
        return {
          valid: false,
          message: 'Access Denied: This booking has already completed and checked out.',
        };
      }

      return {
        valid: true,
        message: 'Valid QR token verified. Driver is authorized for entry.',
        booking: {
          id: booking.id,
          bookingReference: booking.bookingReference,
          driverName: booking.driverName,
          vehiclePlate: booking.vehicleDetails.plateNumber,
          vehicleType: booking.vehicleDetails.vehicleType,
          parkingName: booking.parkingName,
          startTime: booking.startTime,
          endTime: booking.endTime,
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
          amount: booking.totalAmount,
          alreadyCheckedIn: booking.bookingStatus === 'CHECKED_IN',
          checkInTime: booking.checkInTime,
        },
      };
    }
  },

  recordCheckIn: async (bookingId: string): Promise<Booking> => {
    try {
      const response = await apiClient.post<Booking>(`/qr/check-in`, { bookingId });
      return response.data;
    } catch (err) {
      const bookings = getStoredBookings();
      const idx = bookings.findIndex((b) => b.id === bookingId);
      if (idx === -1) throw new Error('Booking not found');

      bookings[idx].bookingStatus = 'CHECKED_IN';
      bookings[idx].checkInTime = new Date().toISOString();
      saveStoredBookings(bookings);
      return bookings[idx];
    }
  },

  recordCheckOut: async (bookingId: string): Promise<Booking> => {
    try {
      const response = await apiClient.post<Booking>(`/qr/check-out`, { bookingId });
      return response.data;
    } catch (err) {
      const bookings = getStoredBookings();
      const idx = bookings.findIndex((b) => b.id === bookingId);
      if (idx === -1) throw new Error('Booking not found');

      bookings[idx].bookingStatus = 'COMPLETED';
      bookings[idx].checkOutTime = new Date().toISOString();

      // Release capacity back to parking location
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
};
