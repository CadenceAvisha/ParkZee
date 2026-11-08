import { z } from 'zod';
import { ParkingType, VehicleType, ListingVerificationStatus } from '../../types/index.js';

export const createParkingValidationSchema = z.object({
  name: z.string().min(3, 'Facility name must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  postalCode: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  entranceLatitude: z.coerce.number().min(-90).max(90).optional(),
  entranceLongitude: z.coerce.number().min(-180).max(180).optional(),
  parkingType: z.enum([
    ParkingType.COVERED,
    ParkingType.UNCOVERED,
    ParkingType.MULTI_LEVEL,
    ParkingType.UNDERGROUND,
    ParkingType.DRIVEWAY,
  ]),
  supportedVehicleTypes: z.array(z.string()).min(1, 'At least one supported vehicle type is required'),
  totalCapacity: z.coerce.number().int().min(1, 'Capacity must be at least 1 slot'),
  pricePerHour: z.coerce.number().min(1, 'Price per hour must be at least 1'),
  pricingUnit: z.enum(['hour', 'day']).default('hour'),
  is24x7: z.coerce.boolean().default(false),
  openTime: z.string().default('06:00'),
  closeTime: z.string().default('23:00'),
  openDays: z.array(z.string()).default(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
});

export const updateParkingValidationSchema = createParkingValidationSchema.partial();

export const parkingSearchQuerySchema = z.object({
  locationQuery: z.string().optional(),
  q: z.string().optional(), // Support query param alias
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.5).max(100).default(25),
  vehicleType: z.string().optional(),
  vehicle: z.string().optional(),
  parkingType: z.string().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  amenities: z.union([z.string(), z.array(z.string())]).optional(),
  sortBy: z.enum(['distance', 'price_asc', 'price_desc', 'rating', 'capacity']).default('distance'),
});

export const updateVerificationValidationSchema = z.object({
  status: z.enum([
    ListingVerificationStatus.PENDING,
    ListingVerificationStatus.APPROVED,
    ListingVerificationStatus.REJECTED,
    ListingVerificationStatus.SUSPENDED,
  ]),
  rejectionReason: z.string().optional(),
});
