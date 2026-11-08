import { VehicleType } from './user.types';

export type ParkingType = 'covered' | 'uncovered' | 'multi-level' | 'underground' | 'driveway';

export type ListingVerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface OperatingHours {
  openTime: string; // e.g. "06:00"
  closeTime: string; // e.g. "23:00"
  is24x7: boolean;
  openDays: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
}

export interface ParkingLocation {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerPhone?: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode?: string;
  location: Coordinates;
  entranceLocation?: Coordinates;
  supportedVehicleTypes: VehicleType[];
  parkingType: ParkingType;
  totalCapacity: number;
  availableCapacity: number;
  pricePerHour: number;
  pricingUnit?: 'hour' | 'day';
  operatingHours: OperatingHours;
  amenities: string[];
  photos: string[];
  verificationStatus: ListingVerificationStatus;
  rejectionReason?: string;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  distanceKm?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ParkingSearchFilters {
  locationQuery?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  vehicleType?: VehicleType;
  parkingType?: ParkingType;
  maxPrice?: number;
  amenities?: string[];
  sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'rating' | 'capacity';
}
