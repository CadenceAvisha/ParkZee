import crypto from 'crypto';
import mongoose from 'mongoose';
import { PaymentConfirmationModel } from './payment.model.js';
import { BookingModel } from '../bookings/booking.model.js';
import { ParkingLocationModel } from '../parking/parking.model.js';
import {
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  UserRole,
} from '../../types/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { emitToUser, emitToOwner, emitToAdmin } from '../../realtime/socket.js';

export class PaymentService {
  /**
   * Confirms offline direct payment received by host.
   * STRICT POLICY: No online payment gateway.
   * Records owner's attestation, generates secure QR token, transitions status to CONFIRMED.
   */
  async confirmDirectPayment(
    ownerId: string,
    ownerName: string,
    userRole: string,
    data: {
      bookingId: string;
      amountReceived: number;
      paymentMethod: PaymentMethod;
      notes?: string;
    }
  ): Promise<{ booking: any; paymentRecord: any }> {
    const booking = await BookingModel.findById(data.bookingId);
    if (!booking) {
      throw new AppError('Booking record not found for payment confirmation.', 404);
    }

    const parking = await ParkingLocationModel.findById(booking.parkingLocationId);
    if (!parking) {
      throw new AppError('Parking facility record not found.', 404);
    }

    // Role & Authorization Check:
    // Drivers are strictly forbidden from confirming their own payment!
    if (booking.driverId.toString() === ownerId && userRole.toUpperCase() !== UserRole.ADMIN) {
      throw new AppError(
        'Unauthorized: Drivers are strictly forbidden from confirming their own payments. Payment confirmation must be recorded by the parking host.',
        403
      );
    }

    // Verify ownership: only the owner of this parking space or an admin can confirm
    const isOwner = parking.ownerId.toString() === ownerId;
    const isAdmin = userRole.toUpperCase() === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new AppError(
        'Unauthorized: You are not authorized to confirm payments for this parking space.',
        403
      );
    }

    // Status validation
    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      throw new AppError('Cannot confirm payment for a cancelled reservation.', 400);
    }

    if (booking.bookingStatus === BookingStatus.EXPIRED) {
      throw new AppError('Cannot confirm payment for an expired reservation.', 400);
    }

    // Duplicate check
    if (booking.paymentStatus === PaymentStatus.PAID_CONFIRMED_BY_OWNER) {
      throw new AppError('Direct payment has already been confirmed for this booking.', 409);
    }

    // Validate amount
    if (data.amountReceived <= 0) {
      throw new AppError('Amount received must be greater than zero.', 400);
    }

    const confirmedAt = new Date();

    // Generate unpredictable secure QR verification token
    const randomHex = crypto.randomBytes(6).toString('hex').toUpperCase();
    const secureToken = `PKZ-SEC-${randomHex}-${Date.now()}`;

    // Update booking state
    booking.paymentStatus = PaymentStatus.PAID_CONFIRMED_BY_OWNER;
    booking.bookingStatus = BookingStatus.CONFIRMED;
    booking.paymentMethod = data.paymentMethod;
    booking.paymentConfirmedBy = ownerName || 'Parking Host';
    booking.paymentConfirmedAt = confirmedAt;
    booking.paymentNotes = data.notes;
    booking.verificationToken = secureToken;

    await booking.save();

    // Persist immutable audit log
    const paymentRecord = await PaymentConfirmationModel.create({
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      driverId: booking.driverId,
      driverName: booking.driverName,
      ownerId: new mongoose.Types.ObjectId(ownerId),
      ownerName: ownerName || 'Parking Host',
      amount: data.amountReceived,
      currency: 'INR',
      paymentMethod: data.paymentMethod,
      paymentStatus: PaymentStatus.PAID_CONFIRMED_BY_OWNER,
      confirmedAt,
      notes: data.notes,
    });

    const bookingJson = booking.toJSON();
    const paymentRecordJson = paymentRecord.toJSON();

    // Notify Driver in real-time that payment has been recorded and QR is now live
    emitToUser(booking.driverId.toString(), 'booking:confirmed', {
      bookingId: booking._id.toString(),
      bookingReference: booking.bookingReference,
      paymentMethod: data.paymentMethod,
      amount: data.amountReceived,
    });

    emitToOwner(ownerId, 'payment:confirmed', {
      bookingId: booking._id.toString(),
      bookingReference: booking.bookingReference,
      amount: data.amountReceived,
    });

    emitToAdmin('admin:payment_confirmed', {
      bookingReference: booking.bookingReference,
      amount: data.amountReceived,
    });

    return {
      booking: bookingJson,
      paymentRecord: paymentRecordJson,
    };
  }

  async getPaymentHistory(ownerId?: string, userRole?: string): Promise<any[]> {
    const query: Record<string, any> = {};

    if (ownerId && userRole?.toUpperCase() !== UserRole.ADMIN) {
      query.ownerId = ownerId;
    }

    const payments = await PaymentConfirmationModel.find(query)
      .sort({ confirmedAt: -1 })
      .lean();

    return payments.map((p: any) => ({
      ...p,
      id: p._id.toString(),
    }));
  }
}

export const paymentService = new PaymentService();
