import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  BookingVehicleDetails,
  VehicleType,
} from '../../types/index.js';

export interface IBooking extends Document {
  bookingReference: string;
  driverId: mongoose.Types.ObjectId;
  driverName: string;
  driverPhone?: string;
  driverEmail?: string;
  parkingLocationId: mongoose.Types.ObjectId;
  parkingName: string;
  parkingAddress: string;
  parkingCoordinates: {
    latitude: number;
    longitude: number;
  };
  vehicleDetails: BookingVehicleDetails;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  pricePerHour: number;
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  reservationExpiresAt: Date;
  paymentMethod?: PaymentMethod;
  paymentConfirmedBy?: string;
  paymentConfirmedAt?: Date;
  paymentNotes?: string;
  verificationToken?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    driverPhone: {
      type: String,
    },
    driverEmail: {
      type: String,
    },
    parkingLocationId: {
      type: Schema.Types.ObjectId,
      ref: 'ParkingLocation',
      required: true,
      index: true,
    },
    parkingName: {
      type: String,
      required: true,
    },
    parkingAddress: {
      type: String,
      required: true,
    },
    parkingCoordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    vehicleDetails: {
      plateNumber: { type: String, required: true, uppercase: true },
      makeModel: { type: String, required: true },
      vehicleType: {
        type: String,
        enum: Object.values(VehicleType),
        required: true,
      },
      color: { type: String },
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    durationHours: {
      type: Number,
      required: true,
    },
    pricePerHour: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.NOT_PAID,
      index: true,
    },
    reservationExpiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
    },
    paymentConfirmedBy: {
      type: String,
    },
    paymentConfirmedAt: {
      type: Date,
    },
    paymentNotes: {
      type: String,
    },
    verificationToken: {
      type: String,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index to accelerate overlap checks
bookingSchema.index({
  parkingLocationId: 1,
  bookingStatus: 1,
  startTime: 1,
  endTime: 1,
});

export const BookingModel: Model<IBooking> = mongoose.model<IBooking>(
  'Booking',
  bookingSchema
);
