import { BookingModel } from '../bookings/booking.model.js';
import { ParkingLocationModel } from '../parking/parking.model.js';
import { BookingStatus, PaymentStatus, UserRole } from '../../types/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  emitToUser,
  emitToOwner,
  emitToParking,
  emitToAdmin,
} from '../../realtime/socket.js';

export interface QRScanVerificationResult {
  valid: boolean;
  message: string;
  booking?: {
    id: string;
    bookingReference: string;
    driverName: string;
    vehiclePlate: string;
    vehicleType: string;
    parkingName: string;
    startTime: string | Date;
    endTime: string | Date;
    bookingStatus: string;
    paymentStatus: string;
    amount: number;
    alreadyCheckedIn: boolean;
    checkInTime?: string | Date;
  };
}

export class QRService {
  /**
   * Backend Verification of Booking QR Token
   * Restricts verification to authorized host, checks location, validity, payment attestation
   */
  async verifyQRToken(
    token: string,
    scannerUserId: string,
    scannerUserRole: string,
    ownerParkingId?: string
  ): Promise<QRScanVerificationResult> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return {
        valid: false,
        message: 'Empty QR token received.',
      };
    }

    // Lookup booking by verification token, reference, or mongo ID
    const booking = await BookingModel.findOne({
      $or: [
        { verificationToken: cleanToken },
        { bookingReference: cleanToken.toUpperCase() },
        { _id: cleanToken.match(/^[0-9a-fA-F]{24}$/) ? cleanToken : undefined },
      ].filter(Boolean),
    });

    if (!booking) {
      return {
        valid: false,
        message: 'Invalid or unknown QR code. No active reservation found matching this token.',
      };
    }

    const parking = await ParkingLocationModel.findById(booking.parkingLocationId);
    if (!parking) {
      return {
        valid: false,
        message: 'Associated parking facility does not exist.',
      };
    }

    // Authorization: Verify scanning host owns this facility (or is admin)
    const isAdmin = scannerUserRole.toUpperCase() === UserRole.ADMIN;
    const ownsParking = parking.ownerId.toString() === scannerUserId;

    if (!ownsParking && !isAdmin) {
      return {
        valid: false,
        message: `Unauthorized scanner: This reservation belongs to "${parking.name}". You are not authorized to scan for this location.`,
      };
    }

    // Location check if scanner specified a parking ID
    if (ownerParkingId && booking.parkingLocationId.toString() !== ownerParkingId) {
      return {
        valid: false,
        message: `QR code belongs to a different facility (${booking.parkingName}). Not valid for selected location.`,
      };
    }

    // Status checks
    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      return {
        valid: false,
        message: 'Access Denied: This reservation was previously cancelled.',
      };
    }

    if (booking.bookingStatus === BookingStatus.EXPIRED) {
      return {
        valid: false,
        message: 'Access Denied: This reservation has expired.',
      };
    }

    if (booking.paymentStatus !== PaymentStatus.PAID_CONFIRMED_BY_OWNER) {
      return {
        valid: false,
        message: 'Access Denied: Direct offline payment has not been confirmed by host yet.',
      };
    }

    if (booking.bookingStatus === BookingStatus.COMPLETED) {
      return {
        valid: false,
        message: 'Access Denied: This parking session has already completed and checked out.',
      };
    }

    // Time window expiry check: reject QR verification if arriving significantly past scheduled endTime
    const now = new Date();
    const maxEntryTime = new Date(new Date(booking.endTime).getTime() + 60 * 60 * 1000); // 1 hour past scheduled departure
    if (booking.bookingStatus !== BookingStatus.CHECKED_IN && now > maxEntryTime) {
      return {
        valid: false,
        message: 'Access Denied: Scheduled reservation time window has expired.',
      };
    }

    return {
      valid: true,
      message: 'Valid QR token verified. Driver is authorized for entry.',
      booking: {
        id: booking._id.toString(),
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
        alreadyCheckedIn: booking.bookingStatus === BookingStatus.CHECKED_IN,
        checkInTime: booking.checkInTime,
      },
    };
  }

  async recordCheckIn(
    bookingId: string,
    scannerUserId: string,
    scannerUserRole: string
  ): Promise<any> {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    const parking = await ParkingLocationModel.findById(booking.parkingLocationId);
    if (!parking) {
      throw new AppError('Parking facility not found.', 404);
    }

    const isAdmin = scannerUserRole.toUpperCase() === UserRole.ADMIN;
    const ownsParking = parking.ownerId.toString() === scannerUserId;
    if (!ownsParking && !isAdmin) {
      throw new AppError('Unauthorized: You do not own this parking facility.', 403);
    }

    if (booking.paymentStatus !== PaymentStatus.PAID_CONFIRMED_BY_OWNER) {
      throw new AppError('Cannot check in: Direct payment has not been confirmed.', 400);
    }

    if (booking.bookingStatus === BookingStatus.CHECKED_IN) {
      throw new AppError('Vehicle has already been checked in.', 400);
    }

    if (booking.bookingStatus === BookingStatus.COMPLETED) {
      throw new AppError('Booking session has already ended.', 400);
    }

    const checkInTime = new Date();
    booking.bookingStatus = BookingStatus.CHECKED_IN;
    booking.checkInTime = checkInTime;
    await booking.save();

    const bookingJson = booking.toJSON();

    emitToUser(booking.driverId.toString(), 'booking:checked_in', {
      bookingReference: booking.bookingReference,
      checkInTime,
    });

    emitToOwner(parking.ownerId.toString(), 'booking:checked_in', {
      bookingReference: booking.bookingReference,
      checkInTime,
    });

    return bookingJson;
  }

  async recordCheckOut(
    bookingId: string,
    scannerUserId: string,
    scannerUserRole: string
  ): Promise<any> {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    const parking = await ParkingLocationModel.findById(booking.parkingLocationId);
    if (!parking) {
      throw new AppError('Parking facility not found.', 404);
    }

    const isAdmin = scannerUserRole.toUpperCase() === UserRole.ADMIN;
    const ownsParking = parking.ownerId.toString() === scannerUserId;
    if (!ownsParking && !isAdmin) {
      throw new AppError('Unauthorized: You do not own this parking facility.', 403);
    }

    if (booking.bookingStatus === BookingStatus.COMPLETED) {
      throw new AppError('Booking has already checked out.', 400);
    }

    const checkOutTime = new Date();
    booking.bookingStatus = BookingStatus.COMPLETED;
    booking.checkOutTime = checkOutTime;
    await booking.save();

    // Release slot capacity back into available pool
    const activeCount = await BookingModel.countDocuments({
      parkingLocationId: parking._id,
      bookingStatus: {
        $in: [
          BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION,
          BookingStatus.CONFIRMED,
          BookingStatus.CHECKED_IN,
        ],
      },
      startTime: { $lt: new Date() },
      endTime: { $gt: new Date() },
    });

    parking.availableCapacity = Math.min(
      parking.totalCapacity,
      Math.max(0, parking.totalCapacity - activeCount)
    );
    await parking.save();

    const bookingJson = booking.toJSON();

    emitToUser(booking.driverId.toString(), 'booking:completed', {
      bookingReference: booking.bookingReference,
      checkOutTime,
    });

    emitToOwner(parking.ownerId.toString(), 'booking:completed', {
      bookingReference: booking.bookingReference,
      checkOutTime,
    });

    emitToParking(parking._id.toString(), 'parking:availability_updated', {
      parkingId: parking._id.toString(),
      availableCapacity: parking.availableCapacity,
    });

    return bookingJson;
  }
}

export const qrService = new QRService();
