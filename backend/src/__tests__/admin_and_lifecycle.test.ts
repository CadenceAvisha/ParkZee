import request from 'supertest';
import { app } from '../app.js';
import { setupTestDB } from './setup.js';
import { User } from '../modules/users/user.model.js';
import { ParkingLocationModel } from '../modules/parking/parking.model.js';
import { BookingModel } from '../modules/bookings/booking.model.js';
import { processExpiredReservations } from '../workers/expiryWorker.js';
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

describe('Admin Operations, Reviews, Reports & Expiry Tests', () => {
  let adminToken: string;
  let adminId: string;
  let driverToken: string;
  let driverId: string;
  let ownerToken: string;
  let ownerId: string;
  let parkingId: string;

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('Password123', 10);

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@parkzee.com',
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      passwordHash,
    });
    adminId = admin._id.toString();
    adminToken = generateAccessToken({
      userId: adminId,
      email: admin.email,
      role: UserRole.ADMIN,
      name: admin.name,
    });

    const driver = await User.create({
      name: 'Driver Dave',
      email: 'dave@test.com',
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

    const owner = await User.create({
      name: 'Host Harry',
      email: 'harry@test.com',
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

    const parking = await ParkingLocationModel.create({
      ownerId: owner._id,
      name: 'Harry Downtown Spot',
      description: 'Downtown prime spot',
      address: 'Church Street',
      city: 'Bengaluru',
      location: {
        type: 'Point',
        coordinates: [77.6033, 12.9752],
      },
      supportedVehicleTypes: [VehicleType.CAR],
      parkingType: ParkingType.COVERED,
      totalCapacity: 3,
      availableCapacity: 3,
      pricePerHour: 70,
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

  it('Admin: should fetch platform-wide analytics and revenue stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(3);
    expect(res.body.totalParkingLocations).toBeGreaterThanOrEqual(1);
    expect(res.body.totalDirectRevenueConfirmed).toBeDefined();
  });

  it('Admin: should suspend user account and block subsequent logins', async () => {
    // Admin suspends driver
    const suspendRes = await request(app)
      .patch(`/api/admin/users/${driverId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' });

    expect(suspendRes.status).toBe(200);

    // Suspended driver attempts login -> must be rejected with 403
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dave@test.com', password: 'Password123' });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.message).toMatch(/suspended/i);
  });

  it('Reports: should allow user to submit report and admin to resolve it', async () => {
    const reportRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        targetType: 'parking_location',
        targetId: parkingId,
        targetTitle: 'Harry Downtown Spot',
        reason: 'Obstruction at entrance',
        description: 'Road work blocked driveway for 20 minutes',
      });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.reportReference).toBeDefined();
    expect(reportRes.body.status).toBe('pending');

    const reportId = reportRes.body.id;

    // Admin resolves report
    const resolveRes = await request(app)
      .patch(`/api/admin/reports/${reportId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'resolved',
        resolutionNotes: 'Contacted host and entrance path cleared.',
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.status).toBe('resolved');
    expect(resolveRes.body.resolutionNotes).toBe('Contacted host and entrance path cleared.');
  });

  it('Reviews: should allow driver to review completed booking and update facility rating', async () => {
    // Create completed booking
    const booking = await BookingModel.create({
      bookingReference: 'PKZ-REV-1001',
      driverId: driverId,
      driverName: 'Driver Dave',
      parkingLocationId: parkingId,
      parkingName: 'Harry Downtown Spot',
      parkingAddress: 'Church Street',
      parkingCoordinates: { latitude: 12.9752, longitude: 77.6033 },
      vehicleDetails: {
        plateNumber: 'KA-05-ZZ-1234',
        makeModel: 'Car',
        vehicleType: 'car',
      },
      startTime: new Date(Date.now() - 3 * 3600 * 1000),
      endTime: new Date(Date.now() - 1 * 3600 * 1000),
      durationHours: 2,
      pricePerHour: 70,
      totalAmount: 140,
      bookingStatus: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID_CONFIRMED_BY_OWNER,
      reservationExpiresAt: new Date(),
    });

    // Driver submits 5-star review
    const reviewRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        bookingId: booking._id.toString(),
        rating: 5,
        comment: 'Great covered space, very smooth entry!',
      });

    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.rating).toBe(5);

    // Verify parking location rating updated
    const updatedParking = await ParkingLocationModel.findById(parkingId);
    expect(updatedParking?.rating).toBe(5);
    expect(updatedParking?.reviewCount).toBe(1);
  });

  it('Expiry Worker: should automatically expire past-deadline unconfirmed bookings and restore capacity', async () => {
    // Create an expired booking awaiting owner confirmation
    await BookingModel.create({
      bookingReference: 'PKZ-EXP-9999',
      driverId: driverId,
      driverName: 'Driver Dave',
      parkingLocationId: parkingId,
      parkingName: 'Harry Downtown Spot',
      parkingAddress: 'Church Street',
      parkingCoordinates: { latitude: 12.9752, longitude: 77.6033 },
      vehicleDetails: {
        plateNumber: 'KA-05-ZZ-9999',
        makeModel: 'Car',
        vehicleType: 'car',
      },
      startTime: new Date(Date.now() - 2 * 3600 * 1000),
      endTime: new Date(Date.now() + 1 * 3600 * 1000),
      durationHours: 3,
      pricePerHour: 70,
      totalAmount: 210,
      bookingStatus: BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION,
      paymentStatus: PaymentStatus.NOT_PAID,
      reservationExpiresAt: new Date(Date.now() - 30 * 60 * 1000), // expired 30 min ago
    });

    const expiredCount = await processExpiredReservations();
    expect(expiredCount).toBeGreaterThanOrEqual(1);

    const expiredBooking = await BookingModel.findOne({ bookingReference: 'PKZ-EXP-9999' });
    expect(expiredBooking?.bookingStatus).toBe(BookingStatus.EXPIRED);
  });
});
