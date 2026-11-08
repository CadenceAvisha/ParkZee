import { PaymentMethod, PaymentStatus } from './booking.types';

export interface ConfirmPaymentRequest {
  bookingId: string;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  notes?: string;
}

export interface PaymentConfirmationRecord {
  id: string;
  bookingId: string;
  bookingReference: string;
  driverId: string;
  driverName: string;
  ownerId: string;
  ownerName: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  confirmedAt: string;
  notes?: string;
}

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
    startTime: string;
    endTime: string;
    bookingStatus: string;
    paymentStatus: string;
    amount: number;
    alreadyCheckedIn: boolean;
    checkInTime?: string;
  };
}
