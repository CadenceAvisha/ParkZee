import { Coordinates, ParkingLocation } from './parking.types';
import { VehicleType } from './user.types';

export type BookingStatus =
  | 'RESERVED_AWAITING_OWNER_CONFIRMATION'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DISPUTED';

export type PaymentStatus =
  | 'NOT_PAID'
  | 'PAID_CONFIRMED_BY_OWNER'
  | 'PAYMENT_DISPUTED';

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other';

export interface BookingVehicleDetails {
  plateNumber: string;
  makeModel: string;
  vehicleType: VehicleType;
  color?: string;
}

export interface Booking {
  id: string;
  bookingReference: string; // e.g., "PKZ-2026-8941"
  driverId: string;
  driverName: string;
  driverPhone?: string;
  driverEmail?: string;
  parkingLocationId: string;
  parkingLocation?: ParkingLocation;
  parkingName: string;
  parkingAddress: string;
  parkingCoordinates: Coordinates;
  vehicleDetails: BookingVehicleDetails;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
  durationHours: number;
  pricePerHour: number;
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentConfirmedBy?: string; // owner ID or name
  paymentConfirmedAt?: string; // ISO date string
  paymentNotes?: string;
  verificationToken?: string; // Random secure token returned only when CONFIRMED
  qrCodeUrl?: string;         // Or data URI
  checkInTime?: string;
  checkOutTime?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBookingRequest {
  parkingLocationId: string;
  vehicleDetails: BookingVehicleDetails;
  startTime: string;
  endTime: string;
  totalAmount: number;
}
