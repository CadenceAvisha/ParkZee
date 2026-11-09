import mongoose, { Document, Schema, Model } from 'mongoose';
import { PaymentStatus, PaymentMethod } from '../../types/index.js';

export interface IPaymentConfirmation extends Document {
  bookingId: mongoose.Types.ObjectId;
  bookingReference: string;
  driverId: mongoose.Types.ObjectId;
  driverName: string;
  ownerId: mongoose.Types.ObjectId;
  ownerName: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  confirmedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentConfirmationSchema = new Schema<IPaymentConfirmation>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      index: true,
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
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PAID_CONFIRMED_BY_OWNER,
    },
    confirmedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
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

export const PaymentConfirmationModel: Model<IPaymentConfirmation> =
  mongoose.model<IPaymentConfirmation>(
    'PaymentConfirmation',
    paymentConfirmationSchema
  );
