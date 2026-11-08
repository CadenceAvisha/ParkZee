import { z } from 'zod';
import { VehicleType, BookingStatus } from '../../types/index.js';

export const createBookingValidationSchema = z
  .object({
    parkingLocationId: z.string().min(1, 'Parking location ID is required'),
    vehicleDetails: z.object({
      plateNumber: z.string().min(3, 'Plate number is required').toUpperCase(),
      makeModel: z.string().min(2, 'Make & model is required'),
      vehicleType: z.enum([
        VehicleType.CAR,
        VehicleType.SUV,
        VehicleType.MOTORCYCLE,
        VehicleType.EV,
        VehicleType.TRUCK,
      ]),
      color: z.string().optional(),
    }),
    startTime: z.string().datetime({ message: 'Valid ISO start time required' }),
    endTime: z.string().datetime({ message: 'Valid ISO end time required' }),
  })
  .refine((data) => new Date(data.startTime) < new Date(data.endTime), {
    message: 'Departure time must be strictly after arrival time',
    path: ['endTime'],
  });

export const cancelBookingValidationSchema = z.object({
  reason: z.string().max(300).optional(),
});

export const updateBookingStatusValidationSchema = z.object({
  status: z.enum([
    BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION,
    BookingStatus.CONFIRMED,
    BookingStatus.CHECKED_IN,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
    BookingStatus.EXPIRED,
    BookingStatus.DISPUTED,
  ]),
});
