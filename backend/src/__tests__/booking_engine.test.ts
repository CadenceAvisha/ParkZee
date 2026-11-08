import request from 'supertest';
import { app } from '../app.js';
import { setupTestDB } from './setup.js';
import { User } from '../modules/users/user.model.js';
import { ParkingLocationModel } from '../modules/parking/parking.model.js';
import {
  UserRole,
  AccountStatus,
  ListingVerificationStatus,
  BookingStatus,
  PaymentStatus,
  ParkingType,
  VehicleType,
} from '../types/index.js';
import { generateAccessToken } from '../utils/token.js';
import bcrypt from 'bcryptjs';

setupTestDB();

describe('Booking Engine & Overlap Concurrency Tests', () => {
  let driverToken: string;
  let driverId: string;
  let driver2Token: string;
  let driver2Id: string;
  let ownerToken: string;
  let ownerId: string;
  let parkingId: string;

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('Password123', 10);

    // Driver 1
    const driver = await User.create({
      name: 'John Driver',
      email: 'driver1@test.com',
      role: UserRole.DRIVER,
      accountStatus: AccountStatus.ACTIVE,
      passwordHash,
    });
    driverId = driver._id.toString();
    driverToken = generateAccessToken({
      userId: driverId,
      email: driver.email,
      role: UserRole.DRIVER,
      name: driver.name,
    });

    // Driver 2
    const driver2 = await User.create({
      name: 'Jane Driver',
      email: 'driver2@test.com',
      role: UserRole.DRIVER,
      accountStatus: AccountStatus.ACTIVE,
      passwordHash,
    });
    driver2Id = driver2._id.toString();
    driver2Token = generateAccessToken({
      userId: driver2Id,
      email: driver2.email,
      role: UserRole.DRIVER,
      name: driver2.name,
    });

    // Owner
    const owner = await User.create({
      name: 'Alice Host',
      email: 'host@test.com',
      role: UserRole.OWNER,
      accountStatus: AccountStatus.ACTIVE,
      passwordHash,
    });
    ownerId = owner._id.toString();
    ownerToken = generateAccessToken({
      userId: ownerId,
      email: owner.email,
      role: UserRole.OWNER,
      name: owner.name,
    });

    // Create an Approved Parking Facility with Capacity = 1 (to test collision & concurrency)
    const parking = await ParkingLocationModel.create({
      ownerId: owner._id,
      name: 'Exclusive Single-Bay Garage',
      description: 'Single VIP parking spot with high security',
      address: '100 Residency Road',
      city: 'Bengaluru',
      location: {
        type: 'Point',
        coordinates: [77.6000, 12.9700],
      },
      supportedVehicleTypes: [VehicleType.CAR, VehicleType.SUV, VehicleType.EV],
      parkingType: ParkingType.COVERED,
      totalCapacity: 1,
      availableCapacity: 1,
      pricePerHour: 50,
      operatingHours: {
        openTime: '00:00',
        closeTime: '23:59',
        is24x7: true,
        openDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
      verificationStatus: ListingVerificationStatus.APPROVED,
      isActive: true,
    });
    parkingId = parking._id.toString();
  });

  const getFutureDates = (startHoursAhead = 2, durationHours = 2) => {
    const start = new Date(Date.now() + startHoursAhead * 3600 * 1000);
    const end = new Date(start.getTime() + durationHours * 3600 * 1000);
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
  };

  it('should successfully create reservation without online payment requirement', async () => {
    const { startTime, endTime } = getFutureDates(2, 3); // 3 hours

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        parkingLocationId: parkingId,
        vehicleDetails: {
          plateNumber: 'KA-01-AB-1234',
          makeModel: 'Hyundai Creta',
          vehicleType: 'car',
        },
        startTime,
        endTime,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.bookingReference).toBeDefined();
    expect(res.body.bookingStatus).toBe(BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION);
    expect(res.body.paymentStatus).toBe(PaymentStatus.NOT_PAID);
    // 3 hours * 50 = 150
    expect(res.body.durationHours).toBe(3);
    expect(res.body.totalAmount).toBe(150);
  });

  it('should reject overlapping booking when capacity is exhausted', async () => {
    // Window: 10:00 to 14:00
    const start1 = new Date(Date.now() + 4 * 3600 * 1000);
    const end1 = new Date(start1.getTime() + 4 * 3600 * 1000);

    // Driver 1 reserves
    const res1 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        parkingLocationId: parkingId,
        vehicleDetails: {
          plateNumber: 'KA-01-AB-1234',
          makeModel: 'Honda City',
          vehicleType: 'car',
        },
        startTime: start1.toISOString(),
        endTime: end1.toISOString(),
      });

    expect(res1.status).toBe(201);

    // Driver 2 attempts overlapping reservation: starts 1 hour before end1 (12:00 to 16:00)
    // Overlap condition: newStart < existingEnd && newEnd > existingStart
    const start2 = new Date(start1.getTime() + 2 * 3600 * 1000); // inside [start1, end1]
    const end2 = new Date(start2.getTime() + 3 * 3600 * 1000);

    const res2 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driver2Token}`)
      .send({
        parkingLocationId: parkingId,
        vehicleDetails: {
          plateNumber: 'KA-02-CD-5678',
          makeModel: 'Kia Seltos',
          vehicleType: 'suv',
        },
        startTime: start2.toISOString(),
        endTime: end2.toISOString(),
      });

    expect(res2.status).toBe(409);
    expect(res2.body.message).toMatch(/reserved for the selected time window/i);
  });

  it('should handle simultaneous concurrent booking requests safely without double booking', async () => {
    const { startTime, endTime } = getFutureDates(6, 2);

    // Fire 2 simultaneous booking requests for the exact same single slot
    const req1 = request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        parkingLocationId: parkingId,
        vehicleDetails: {
          plateNumber: 'KA-01-AB-1111',
          makeModel: 'Toyota Innova',
          vehicleType: 'car',
        },
        startTime,
        endTime,
      });

    const req2 = request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driver2Token}`)
      .send({
        parkingLocationId: parkingId,
        vehicleDetails: {
          plateNumber: 'KA-02-CD-2222',
          makeModel: 'Tata Nexon',
          vehicleType: 'ev',
        },
        startTime,
        endTime,
      });

    const [res1, res2] = await Promise.all([req1, req2]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one must succeed (201) and one must be rejected (409)
    expect(statuses).toEqual([201, 409]);
  });

  it('should allow driver to cancel reservation and restore capacity', async () => {
    const { startTime, endTime } = getFutureDates(2, 2);

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        parkingLocationId: parkingId,
        vehicleDetails: {
          plateNumber: 'KA-01-AB-1234',
          makeModel: 'Car',
          vehicleType: 'car',
        },
        startTime,
        endTime,
      });

    const bookingId = bookRes.body.id;

    // Driver cancels booking
    const cancelRes = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ reason: 'Plans changed' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.bookingStatus).toBe('CANCELLED');

    // Driver 2 can now reserve the same slot since slot was freed
    const rebookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driver2Token}`)
      .send({
        parkingLocationId: parkingId,
        vehicleDetails: {
          plateNumber: 'KA-02-CD-5678',
          makeModel: 'Car',
          vehicleType: 'car',
        },
        startTime,
        endTime,
      });

    expect(rebookRes.status).toBe(201);
  });
});
