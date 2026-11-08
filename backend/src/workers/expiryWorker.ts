import cron from 'node-cron';
import { BookingModel } from '../modules/bookings/booking.model.js';
import { ParkingLocationModel } from '../modules/parking/parking.model.js';
import { BookingStatus, PaymentStatus } from '../types/index.js';
import { emitToUser, emitToOwner, emitToParking } from '../realtime/socket.js';

export const processExpiredReservations = async (): Promise<number> => {
  const now = new Date();

  // Find expired bookings awaiting direct payment confirmation
  const expiredBookings = await BookingModel.find({
    bookingStatus: BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION,
    paymentStatus: PaymentStatus.NOT_PAID,
    reservationExpiresAt: { $lt: now },
  });

  if (expiredBookings.length === 0) return 0;

  for (const booking of expiredBookings) {
    booking.bookingStatus = BookingStatus.EXPIRED;
    await booking.save();

    // Recompute capacity on parking location
    const parking = await ParkingLocationModel.findById(booking.parkingLocationId);
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

      emitToOwner(parking.ownerId.toString(), 'booking:expired', {
        bookingReference: booking.bookingReference,
        parkingName: parking.name,
      });
    }

    emitToUser(booking.driverId.toString(), 'booking:expired', {
      bookingReference: booking.bookingReference,
      reason: 'Reservation window expired prior to host payment confirmation',
    });
  }

  return expiredBookings.length;
};

export const startReservationExpiryWorker = (): cron.ScheduledTask => {
  // Run every 2 minutes
  return cron.schedule('*/2 * * * *', async () => {
    try {
      const count = await processExpiredReservations();
      if (count > 0) {
        console.log(`[ExpiryWorker] Expired ${count} unconfirmed reservation(s) and released capacity.`);
      }
    } catch (err) {
      console.error('[ExpiryWorker] Error running reservation expiry pass:', err);
    }
  });
};
