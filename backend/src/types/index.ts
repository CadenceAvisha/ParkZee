export enum UserRole {
  DRIVER = 'DRIVER',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export enum ParkingType {
  COVERED = 'covered',
  UNCOVERED = 'uncovered',
  MULTI_LEVEL = 'multi-level',
  UNDERGROUND = 'underground',
  DRIVEWAY = 'driveway',
}

export enum VehicleType {
  CAR = 'car',
  SUV = 'suv',
  MOTORCYCLE = 'motorcycle',
  EV = 'ev',
  TRUCK = 'truck',
}

export enum ListingVerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum BookingStatus {
  RESERVED_AWAITING_OWNER_CONFIRMATION = 'RESERVED_AWAITING_OWNER_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  DISPUTED = 'DISPUTED',
}

export enum PaymentStatus {
  NOT_PAID = 'NOT_PAID',
  PAID_CONFIRMED_BY_OWNER = 'PAID_CONFIRMED_BY_OWNER',
  PAYMENT_DISPUTED = 'PAYMENT_DISPUTED',
}

export enum PaymentMethod {
  CASH = 'cash',
  UPI = 'upi',
  BANK_TRANSFER = 'bank_transfer',
  OTHER = 'other',
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface OperatingHours {
  openTime: string;
  closeTime: string;
  is24x7: boolean;
  openDays: string[];
}

export interface BookingVehicleDetails {
  plateNumber: string;
  makeModel: string;
  vehicleType: VehicleType;
  color?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}
