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
  PaymentMethod,
  ParkingType,
  VehicleType,
} from '../types/index.js';
import { generateAccessToken } from '../utils/token.js';
import bcrypt from 'bcryptjs';

setupTestDB();

describe('Direct Payment Workflow & QR Verification System Tests', () => {
  let driverToken: string;
  let driverId: string;
  let ownerToken: string;
  let ownerId: string;
  let otherOwnerToken: string;
  let otherOwnerId: string;
  let parkingId: string;

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('Password123', 10);

    // Driver
    const driver = await User.create({
      name: 'Ravi Kumar',
      email: 'ravi@test.com',
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

    // Owner (Host)
    const owner = await User.create({
      name: 'Suresh Parking Host',
      email: 'suresh@test.com',
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

    // Other Owner
    const otherOwner = await User.create({
      name: 'Other Host',
      email: 'other@test.com',
      role: UserRole.OWNER,
      accountStatus: AccountStatus.ACTIVE,
      passwordHash,
    });
    otherOwnerId = otherOwner._id.toString();
    otherOwnerToken = generateAccessToken({
      userId: otherOwnerId,
      email: otherOwner.email,
      role: UserRole.OWNER,
      name: otherOwner.name,
    });

    // Create Parking Facility
    const parking = await ParkingLocationModel.create({
      ownerId: owner._id,
      name: 'Suresh Safe Park',
      description: 'Covered dedicated parking slot',
      address: 'Indiranagar 100ft Road',
      city: 'Bengaluru',
      location: {
        type: 'Point',
        coordinates: [77.6412, 12.9784],
      },
      supportedVehicleTypes: [VehicleType.CAR, VehicleType.SUV],
      parkingType: ParkingType.COVERED,
      totalCapacity: 2,
      availableCapacity: 2,
      pricePerHour: 60,
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

  const createBooking = async () => {
    const startTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    const endTime = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        parkingLocationId: parkingId,
        vehicleDetails: {
          plateNumber: 'KA-04-MN-9999',
          makeModel: 'Maruti Brezza',
          vehicleType: 'car',
        },
        startTime,
        endTime,
      });

    return res.body;
  };

  it('Strict Security Rule: DRIVER cannot confirm their own payment', async () => {
    const booking = await createBooking();

    const res = await request(app)
      .post('/api/payments/confirm-direct')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        bookingId: booking.id,
        amountReceived: 120,
        paymentMethod: 'upi',
      });

    // Must be rejected
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('IDOR Check: Unrelated host cannot confirm payment for this location', async () => {
    const booking = await createBooking();

    const res = await request(app)
      .post('/api/payments/confirm-direct')
      .set('Authorization', `Bearer ${otherOwnerToken}`)
      .send({
        bookingId: booking.id,
        amountReceived: 120,
        paymentMethod: 'cash',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not authorized to confirm payments/i);
  });

  it('Host confirms direct payment -> activates QR verification token and updates status', async () => {
    const booking = await createBooking();

    const confirmRes = await request(app)
      .post('/api/payments/confirm-direct')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        bookingId: booking.id,
        amountReceived: 120,
        paymentMethod: 'cash',
        notes: 'Driver paid ₹120 in cash on entry',
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.booking.paymentStatus).toBe('PAID_CONFIRMED_BY_OWNER');
    expect(confirmRes.body.booking.bookingStatus).toBe('CONFIRMED');
    expect(confirmRes.body.booking.verificationToken).toBeDefined();
    expect(confirmRes.body.booking.verificationToken).toMatch(/^PKZ-SEC-/);
    expect(confirmRes.body.paymentRecord).toBeDefined();
    expect(confirmRes.body.paymentRecord.amount).toBe(120);

    // Duplicate confirmation must be rejected
    const dupRes = await request(app)
      .post('/api/payments/confirm-direct')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        bookingId: booking.id,
        amountReceived: 120,
        paymentMethod: 'cash',
      });

    expect(dupRes.status).toBe(409);
  });

  it('QR Verification: Rejects unconfirmed booking and accepts valid confirmed QR token', async () => {
    const booking = await createBooking();

    // Verification attempt before payment confirmation
    const verifyBeforePayment = await request(app)
      .post('/api/qr/verify')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ token: booking.bookingReference });

    expect(verifyBeforePayment.status).toBe(200);
    expect(verifyBeforePayment.body.valid).toBe(false);
    expect(verifyBeforePayment.body.message).toMatch(/not been confirmed/i);

    // Host records payment
    const confirmRes = await request(app)
      .post('/api/payments/confirm-direct')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        bookingId: booking.id,
        amountReceived: 120,
        paymentMethod: 'upi',
      });

    const secureToken = confirmRes.body.booking.verificationToken;

    // Authorized host scans QR token
    const verifyAfterPayment = await request(app)
      .post('/api/qr/verify')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ token: secureToken });

    expect(verifyAfterPayment.status).toBe(200);
    expect(verifyAfterPayment.body.valid).toBe(true);
    expect(verifyAfterPayment.body.booking.vehiclePlate).toBe('KA-04-MN-9999');

    // Wrong host scans QR token -> access denied
    const wrongHostScan = await request(app)
      .post('/api/qr/verify')
      .set('Authorization', `Bearer ${otherOwnerToken}`)
      .send({ token: secureToken });

    expect(wrongHostScan.status).toBe(200);
    expect(wrongHostScan.body.valid).toBe(false);
    expect(wrongHostScan.body.message).toMatch(/unauthorized scanner/i);
  });

  it('Check-In and Check-Out Lifecycle: records timestamps and releases capacity', async () => {
    const booking = await createBooking();

    // Confirm payment
    await request(app)
      .post('/api/payments/confirm-direct')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        bookingId: booking.id,
        amountReceived: 120,
        paymentMethod: 'cash',
      });

    // Check-in
    const checkInRes = await request(app)
      .post('/api/qr/check-in')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ bookingId: booking.id });

    expect(checkInRes.status).toBe(200);
    expect(checkInRes.body.bookingStatus).toBe('CHECKED_IN');
    expect(checkInRes.body.checkInTime).toBeDefined();

    // Duplicate check-in should be rejected
    const dupCheckIn = await request(app)
      .post('/api/qr/check-in')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ bookingId: booking.id });

    expect(dupCheckIn.status).toBe(400);

    // Check-out
    const checkOutRes = await request(app)
      .post('/api/qr/check-out')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ bookingId: booking.id });

    expect(checkOutRes.status).toBe(200);
    expect(checkOutRes.body.bookingStatus).toBe('COMPLETED');
    expect(checkOutRes.body.checkOutTime).toBeDefined();
  });
});
