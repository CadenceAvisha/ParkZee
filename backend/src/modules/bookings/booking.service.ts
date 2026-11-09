import mongoose from 'mongoose';
import { Mutex } from 'async-mutex';
import { BookingModel, IBooking } from './booking.model.js';
import { ParkingLocationModel } from '../parking/parking.model.js';
import {
  BookingStatus,
  PaymentStatus,
  VehicleType,
  ListingVerificationStatus,
  UserRole,
} from '../../types/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { env } from '../../config/environment.js';
import {
  emitToOwner,
  emitToUser,
  emitToParking,
  emitToAdmin,
} from '../../realtime/socket.js';

// Per-parking concurrency mutex to prevent race conditions during overlap allocation
const parkingMutexes = new Map<string, Mutex>();

const getParkingMutex = (parkingId: string): Mutex => {
  let mutex = parkingMutexes.get(parkingId);
  if (!mutex) {
    mutex = new Mutex();
    parkingMutexes.set(parkingId, mutex);
  }
  return mutex;
};

/**
 * Cross-instance distributed lease lock backed by MongoDB.
 * Ensures that if multiple backend instances are deployed behind a load balancer,
 * concurrent booking allocations for the same parking facility are serialized cluster-wide.
 */
const acquireDistributedLock = async (
  lockKey: string,
  timeoutMs = 6000,
  leaseMs = 5000
): Promise<() => Promise<void>> => {
  if (mongoose.connection.readyState !== 1) {
    return async () => {};
  }

  const startTime = Date.now();
  const locksCollection = mongoose.connection.collection('distributed_locks');

  while (Date.now() - startTime < timeoutMs) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + leaseMs);

    try {
      const result = await locksCollection.findOneAndUpdate(
        {
          _id: lockKey as any,
          $or: [{ expiresAt: { $lte: now } }, { expiresAt: { $exists: false } }],
        },
        {
          $set: { lockedAt: now, expiresAt },
        },
        {
          upsert: true,
          returnDocument: 'after',
        }
      );

      if (result) {
        return async () => {
          try {
            await locksCollection.deleteOne({ _id: lockKey as any });
          } catch {
            // Ignore release cleanup error
          }
        };
      }
    } catch (err: any) {
      if (err.code !== 11000) {
        return async () => {};
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  throw new AppError(
    'Facility reservation is experiencing heavy concurrent traffic. Please retry in a few moments.',
    429
  );
};

export class BookingService {
  /**
   * Concurrency-safe Booking Creation
   * Enforces:
   * 1. Operating hours and active listing status
   * 2. Supported vehicle types
   * 3. Backend pricing computation
   * 4. Overlap verification: newStart < existingEnd && newEnd > existingStart
   * 5. Capacity constraints
   */
  async createBooking(
    driverId: string,
    driverName: string,
    driverEmail: string | undefined,
    driverPhone: string | undefined,
    data: {
      parkingLocationId: string;
      vehicleDetails: {
        plateNumber: string;
        makeModel: string;
        vehicleType: VehicleType;
        color?: string;
      };
      startTime: string | Date;
      endTime: string | Date;
    }
  ): Promise<any> {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const now = new Date();

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new AppError('Invalid arrival or departure time format.', 400);
    }

    if (startTime >= endTime) {
      throw new AppError('Departure time must be strictly after arrival time.', 400);
    }

    // Disallow reservations far in the past (allow 5 min grace for clock drift)
    if (startTime.getTime() < now.getTime() - 5 * 60 * 1000) {
      throw new AppError('Arrival time cannot be in the past.', 400);
    }

    const parkingId = data.parkingLocationId;
    const mutex = getParkingMutex(parkingId);

    // Acquire in-process mutex and cross-instance distributed lock
    return await mutex.runExclusive(async () => {
      const releaseDistributedLock = await acquireDistributedLock(`lock:parking:${parkingId}`);
      try {
        const parking = await ParkingLocationModel.findById(parkingId);
        if (!parking) {
          throw new AppError('Parking location not found.', 404);
        }

      if (
        parking.verificationStatus !== ListingVerificationStatus.APPROVED ||
        !parking.isActive
      ) {
        throw new AppError(
          'This parking facility is not currently active or approved for reservations.',
          400
        );
      }

      // Validate supported vehicle type
      const requestedVehicleType = data.vehicleDetails.vehicleType.toLowerCase() as VehicleType;
      const isVehicleSupported = parking.supportedVehicleTypes.some(
        (vt) => vt.toLowerCase() === requestedVehicleType
      );
      if (!isVehicleSupported) {
        throw new AppError(
          `Vehicle type "${data.vehicleDetails.vehicleType}" is not supported by this facility. Supported types: ${parking.supportedVehicleTypes.join(', ')}`,
          400
        );
      }

      // Validate operating hours
      this.validateOperatingHours(parking, startTime, endTime);

      // Concurrency check: overlapping bookings
      // Overlap formula: newStart < existingEnd && newEnd > existingStart
      const activeStatuses = [
        BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION,
        BookingStatus.CONFIRMED,
        BookingStatus.CHECKED_IN,
      ];

      const overlappingCount = await BookingModel.countDocuments({
        parkingLocationId: parking._id,
        bookingStatus: { $in: activeStatuses },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      });

      if (overlappingCount >= parking.totalCapacity) {
        throw new AppError(
          'All parking slots are reserved for the selected time window. Please select a different arrival or departure time.',
          409
        );
      }

      // Calculate duration and total amount strictly on the backend
      const durationHours = Math.max(
        1,
        Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))
      );
      const totalAmount = durationHours * parking.pricePerHour;

      // Generate human-friendly reference
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingReference = `PKZ-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

      // Reservation grace period before direct payment confirmation
      const graceMinutes = env.RESERVATION_GRACE_PERIOD_MINUTES || 15;
      const reservationExpiresAt = new Date(
        Math.max(
          now.getTime() + graceMinutes * 60 * 1000,
          startTime.getTime() + graceMinutes * 60 * 1000
        )
      );

      const booking = await BookingModel.create({
        bookingReference,
        driverId: new mongoose.Types.ObjectId(driverId),
        driverName,
        driverEmail,
        driverPhone,
        parkingLocationId: parking._id,
        parkingName: parking.name,
        parkingAddress: parking.address,
        parkingCoordinates: {
          latitude: parking.location.coordinates[1],
          longitude: parking.location.coordinates[0],
        },
        vehicleDetails: {
          plateNumber: data.vehicleDetails.plateNumber.toUpperCase(),
          makeModel: data.vehicleDetails.makeModel,
          vehicleType: requestedVehicleType,
          color: data.vehicleDetails.color,
        },
        startTime,
        endTime,
        durationHours,
        pricePerHour: parking.pricePerHour,
        totalAmount,
        bookingStatus: BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION,
        paymentStatus: PaymentStatus.NOT_PAID,
        reservationExpiresAt,
      });

      // Update live capacity
      const updatedAvailable = Math.max(0, parking.totalCapacity - (overlappingCount + 1));
      parking.availableCapacity = updatedAvailable;
      await parking.save();

      const bookingJson = booking.toJSON();

      // Real-time notifications
      emitToOwner(parking.ownerId.toString(), 'booking:created', {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
        parkingName: parking.name,
        totalAmount,
      });

      emitToParking(parking._id.toString(), 'parking:availability_updated', {
        parkingId: parking._id.toString(),
        availableCapacity: updatedAvailable,
      });

      emitToAdmin('admin:booking_created', {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
      });

        return bookingJson;
      } finally {
        await releaseDistributedLock();
      }
    });
  }

  async getDriverBookings(driverId: string): Promise<any[]> {
    const bookings = await BookingModel.find({ driverId })
      .sort({ createdAt: -1 })
      .lean();

    return bookings.map((b: any) => ({
      ...b,
      id: b._id.toString(),
    }));
  }

  async getOwnerBookings(ownerId: string): Promise<any[]> {
    const locations = await ParkingLocationModel.find({ ownerId }).select('_id');
    const locationIds = locations.map((l) => l._id);

    const bookings = await BookingModel.find({
      parkingLocationId: { $in: locationIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    return bookings.map((b: any) => ({
      ...b,
      id: b._id.toString(),
    }));
  }

  async getAllBookings(): Promise<any[]> {
    const bookings = await BookingModel.find().sort({ createdAt: -1 }).lean();
    return bookings.map((b: any) => ({
      ...b,
      id: b._id.toString(),
    }));
  }

  async getBookingById(bookingId: string, userId: string, userRole: string): Promise<any> {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    const parking = await ParkingLocationModel.findById(booking.parkingLocationId);

    // IDOR Check: Only driver, property owner, or admin can access booking details
    const normalizedRole = userRole.toUpperCase();
    const isDriver = booking.driverId.toString() === userId;
    const isOwner = parking && parking.ownerId.toString() === userId;
    const isAdmin = normalizedRole === UserRole.ADMIN;

    if (!isDriver && !isOwner && !isAdmin) {
      throw new AppError('Unauthorized: You do not have access to this booking.', 403);
    }

    return booking.toJSON();
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    userRole: string,
    reason?: string
  ): Promise<any> {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    const parking = await ParkingLocationModel.findById(booking.parkingLocationId);

    // Authorization: driver who booked, host, or admin
    const normalizedRole = userRole.toUpperCase();
    const isDriver = booking.driverId.toString() === userId;
    const isOwner = parking && parking.ownerId.toString() === userId;
    const isAdmin = normalizedRole === UserRole.ADMIN;

    if (!isDriver && !isOwner && !isAdmin) {
      throw new AppError('Unauthorized: You cannot cancel this booking.', 403);
    }

    // Only allow cancellation if not checked-in or completed
    if (
      [BookingStatus.CHECKED_IN, BookingStatus.COMPLETED].includes(booking.bookingStatus)
    ) {
      throw new AppError(
        `Cannot cancel reservation in "${booking.bookingStatus}" state. Session has already commenced.`,
        400
      );
    }

    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      throw new AppError('This booking is already cancelled.', 400);
    }

    booking.bookingStatus = BookingStatus.CANCELLED;
    booking.cancellationReason = reason || 'Cancelled by user';
    await booking.save();

    // Recompute and restore capacity
    if (parking) {
      const activeCount = await BookingModel.countDocuments({
        parkingLocationId: parking._id,
        bookingStatus: {
          $in: [
            BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
          ],
        },
        startTime: { $lt: booking.endTime },
        endTime: { $gt: booking.startTime },
      });

      parking.availableCapacity = Math.max(0, parking.totalCapacity - activeCount);
      await parking.save();

      emitToParking(parking._id.toString(), 'parking:availability_updated', {
        parkingId: parking._id.toString(),
        availableCapacity: parking.availableCapacity,
      });
    }

    emitToUser(booking.driverId.toString(), 'booking:cancelled', {
      bookingReference: booking.bookingReference,
      reason: booking.cancellationReason,
    });

    return booking.toJSON();
  }

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    _userId: string,
    _userRole: string
  ): Promise<any> {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    booking.bookingStatus = status;
    await booking.save();
    return booking.toJSON();
  }

  private validateOperatingHours(
    parking: any,
    startTime: Date,
    endTime: Date
  ): void {
    const hours = parking.operatingHours;
    if (!hours || hours.is24x7) return;

    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startDay = daysMap[startTime.getDay()];
    const endDay = daysMap[endTime.getDay()];

    if (hours.openDays && hours.openDays.length > 0) {
      if (!hours.openDays.includes(startDay) || !hours.openDays.includes(endDay)) {
        throw new AppError(
          `Facility is closed on requested days. Open days: ${hours.openDays.join(', ')}`,
          400
        );
      }
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const startHourMin = `${pad(startTime.getHours())}:${pad(startTime.getMinutes())}`;
    const endHourMin = `${pad(endTime.getHours())}:${pad(endTime.getMinutes())}`;

    if (hours.openTime && hours.closeTime) {
      if (startHourMin < hours.openTime || endHourMin > hours.closeTime) {
        throw new AppError(
          `Selected time falls outside operating hours (${hours.openTime} - ${hours.closeTime}).`,
          400
        );
      }
    }
  }
}

export const bookingService = new BookingService();
