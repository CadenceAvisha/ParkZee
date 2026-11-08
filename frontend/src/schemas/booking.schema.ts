import { z } from 'zod';

export const createBookingSchema = z.object({
  parkingLocationId: z.string().min(1, 'Parking location required'),
  vehiclePlate: z.string().min(4, 'Vehicle plate number must be at least 4 characters').toUpperCase(),
  makeModel: z.string().min(2, 'Vehicle make/model required (e.g. Honda City, Hyundai Creta)'),
  vehicleType: z.enum(['car', 'suv', 'motorcycle', 'ev', 'truck']),
  bookingDate: z.string().min(1, 'Booking date is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid start time required (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid end time required (HH:MM)'),
}).refine((data) => {
  // Compare start and end time
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return endMinutes > startMinutes;
}, {
  message: 'Departure time must be after arrival time',
  path: ['endTime'],
});

export type CreateBookingFormData = z.infer<typeof createBookingSchema>;
