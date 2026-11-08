import { z } from 'zod';

export const parkingListingSchema = z.object({
  name: z.string().min(3, 'Parking facility name must be at least 3 characters'),
  description: z.string().min(10, 'Please provide a clear description (at least 10 characters)'),
  address: z.string().min(5, 'Full street address is required'),
  city: z.string().min(2, 'City is required'),
  postalCode: z.string().optional(),
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  parkingType: z.enum(['covered', 'uncovered', 'multi-level', 'underground', 'driveway'], {
    message: 'Please select a parking type',
  }),
  supportedVehicleTypes: z
    .array(z.enum(['car', 'suv', 'motorcycle', 'ev', 'truck']))
    .min(1, 'Select at least one vehicle type'),
  totalCapacity: z.number().int().min(1, 'Capacity must be at least 1 slot'),
  pricePerHour: z.number().min(1, 'Hourly price must be at least ₹1'),
  is24x7: z.boolean(),
  openTime: z.string(),
  closeTime: z.string(),
  openDays: z.array(z.string()).min(1, 'Select at least one active operating day'),
  amenities: z.array(z.string()),
  photos: z.array(z.string()).min(1, 'Please provide at least 1 photo for your parking listing'),
});

export type ParkingListingFormData = z.infer<typeof parkingListingSchema>;
