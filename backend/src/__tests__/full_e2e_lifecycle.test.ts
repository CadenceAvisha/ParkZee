import request from 'supertest';
import { app } from '../app.js';
import { setupTestDB } from './setup.js';
import { User } from '../modules/users/user.model.js';
import { ParkingLocationModel } from '../modules/parking/parking.model.js';
import { BookingModel } from '../modules/bookings/booking.model.js';
import { ReviewModel } from '../modules/reviews/review.model.js';
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

describe('Comprehensive End-to-End Booking Lifecycle Verification', () => {
  let driverToken: string;
  let driverId: string;
  let ownerToken: string;
  let ownerId: string;
  let adminToken: string;
  let adminId: string;
  let parkingId: string;

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Create Admin
    const admin = await User.create({
      name: 'Priya Admin',
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

    // 2. Create Owner
    const owner = await User.create({
      name: 'Vikram Host',
      email: 'owner@parkzee.com',
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

    // 3. Create Driver
    const driver = await User.create({
      name: 'Rahul Commuter',
      email: 'driver@parkzee.com',
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
  });

  it('verifies the full 10-stage lifecycle from discovery to reviews and admin oversight', async () => {
    // Stage 1: Facility Listing Creation & Moderation Approval
    const createListingRes = await request(app)
      .post('/api/parking')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Cyber Heights Premium Garage',
        description: 'Secure, gated parking lot with high-speed EV chargers and 24/7 CCTV surveillance.',
        address: 'Tower A Access Rd, Cyber City',
        city: 'Gurugram',
        postalCode: '122002',
        latitude: 28.4986,
        longitude: 77.0878,
        parkingType: 'covered',
        supportedVehicleTypes: ['car', 'suv', 'ev'],
        totalCapacity: 2,
        pricePerHour: 60,
        is24x7: true,
      });

    expect(createListingRes.status).toBe(201);
    parkingId = createListingRes.body.data.id || createListingRes.body.data._id;
    expect(createListingRes.body.data.verificationStatus).toBe('pending');
    expect(createListingRes.body.data.isActive).toBe(false);

    // Admin approves the listing
    const approveRes = await request(app)
      .patch(`/api/parking/${parkingId}/verification`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.verificationStatus).toBe('approved');
    expect(approveRes.body.data.isActive).toBe(true);

    // Stage 2: Parking Discovery & Search
    const searchRes = await request(app)
      .get('/api/parking/search')
      .query({
        latitude: 28.4986,
        longitude: 77.0878,
        radiusKm: 10,
        vehicleType: 'car',
      });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);
    const foundListing = searchRes.body.data.find((l: any) => l.id === parkingId);
    expect(foundListing).toBeDefined();
    expect(foundListing.name).toBe('Cyber Heights Premium Garage');

    // Stage 3: Booking Creation (Zero Upfront Online Payment)
    const startTime = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
    const endTime = new Date(Date.now() + 6 * 3600 * 1000).toISOString(); // 3 hours

    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        parkingLocationId: parkingId,
        vehicleDetails: {
          plateNumber: 'HR-26-DK-4421',
          makeModel: 'Hyundai Creta',
          vehicleType: 'car',
          color: 'Polar White',
        },
        startTime,
        endTime,
      });

    expect(bookingRes.status).toBe(201);
    const booking = bookingRes.body;
    expect(booking.bookingStatus).toBe(BookingStatus.RESERVED_AWAITING_OWNER_CONFIRMATION);
    expect(booking.paymentStatus).toBe(PaymentStatus.NOT_PAID);
    expect(booking.totalAmount).toBe(180); // 3 hrs * ₹60
    expect(booking.verificationToken).toBeUndefined(); // QR NOT active yet!

    // Stage 4: Availability Validation & Capacity Overlap
    // Fill the 2nd slot
    const secondBookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        parkingLocationId: parkingId,
        vehicleDetails: {
          plateNumber: 'DL-01-AB-9999',
          makeModel: 'Honda City',
          vehicleType: 'car',
        },
        startTime,
        endTime,
      });
    expect(secondBookingRes.status).toBe(201);

    // Attempt 3rd overlapping booking (exceeds totalCapacity = 2)
    const thirdBookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        parkingLocationId: parkingId,
        vehicleDetails: {
          plateNumber: 'KA-02-CD-1111',
          makeModel: 'Tata Nexon',
          vehicleType: 'car',
        },
        startTime,
        endTime,
      });
    expect(thirdBookingRes.status).toBe(409);
    expect(thirdBookingRes.body.message).toMatch(/reserved for the selected time window/i);

    // Stage 5: Payment Authorization Guardrails
    // Driver attempts to confirm their own offline payment -> MUST be rejected
    const driverSelfConfirm = await request(app)
      .post('/api/payments/confirm-direct')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        bookingId: booking.id,
        amountReceived: 180,
        paymentMethod: 'upi',
      });
    expect([401, 403]).toContain(driverSelfConfirm.status);

    // Host confirms direct offline payment
    const ownerConfirmRes = await request(app)
      .post('/api/payments/confirm-direct')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        bookingId: booking.id,
        amountReceived: 180,
        paymentMethod: 'cash',
        notes: 'Driver paid ₹180 cash on arrival',
      });

    expect(ownerConfirmRes.status).toBe(200);
    expect(ownerConfirmRes.body.booking.bookingStatus).toBe(BookingStatus.CONFIRMED);
    expect(ownerConfirmRes.body.booking.paymentStatus).toBe(PaymentStatus.PAID_CONFIRMED_BY_OWNER);
    const secureToken = ownerConfirmRes.body.booking.verificationToken;
    expect(secureToken).toBeDefined();
    expect(secureToken).toMatch(/^PKZ-SEC-/);

    // Stage 6: QR Gate Verification
    const qrVerifyRes = await request(app)
      .post('/api/qr/verify')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ token: secureToken });

    expect(qrVerifyRes.status).toBe(200);
    expect(qrVerifyRes.body.valid).toBe(true);
    expect(qrVerifyRes.body.booking.driverName).toBe('Rahul Commuter');
    expect(qrVerifyRes.body.booking.vehiclePlate).toBe('HR-26-DK-4421');

    // Stage 7: Gate Check-In
    const checkInRes = await request(app)
      .post('/api/qr/check-in')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ bookingId: booking.id });

    expect(checkInRes.status).toBe(200);
    expect(checkInRes.body.bookingStatus).toBe(BookingStatus.CHECKED_IN);
    expect(checkInRes.body.checkInTime).toBeDefined();

    // Stage 8: Gate Check-Out & Capacity Release
    const checkOutRes = await request(app)
      .post('/api/qr/check-out')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ bookingId: booking.id });

    expect(checkOutRes.status).toBe(200);
    expect(checkOutRes.body.bookingStatus).toBe(BookingStatus.COMPLETED);
    expect(checkOutRes.body.checkOutTime).toBeDefined();

    // Stage 9: Rating & Review Submission
    const reviewRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        bookingId: booking.id,
        rating: 5,
        comment: 'Outstanding parking facility! Wide ramp, fast entry, and friendly host.',
      });

    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.data.rating).toBe(5);

    // Check updated parking location rating
    const updatedParking = await ParkingLocationModel.findById(parkingId);
    expect(updatedParking?.rating).toBe(5);
    expect(updatedParking?.reviewCount).toBe(1);

    // Public review retrieval
    const getReviewsRes = await request(app).get(`/api/reviews/parking/${parkingId}`);
    expect(getReviewsRes.status).toBe(200);
    expect(getReviewsRes.body.length).toBe(1);
    expect(getReviewsRes.body[0].comment).toContain('Outstanding parking facility');

    // Stage 10: Platform Reports & Admin Dispute Resolution
    const reportRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        targetType: 'booking',
        targetId: booking.id,
        targetTitle: `Booking ${booking.bookingReference}`,
        reason: 'Payment Discrepancy',
        description: 'Host requested exact change for offline cash settlement.',
      });

    expect(reportRes.status).toBe(201);
    const reportId = reportRes.body.data.id || reportRes.body.data._id;

    // Admin resolves report
    const resolveRes = await request(app)
      .patch(`/api/admin/reports/${reportId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'resolved',
        resolutionNotes: 'Advised host to keep fractional change or accept UPI QR codes.',
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.status).toBe('resolved');

    // Admin Stats verification
    const statsRes = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.totalUsers).toBeGreaterThanOrEqual(3);
    expect(statsRes.body.completedBookings).toBeGreaterThanOrEqual(1);
    expect(statsRes.body.totalDirectRevenueConfirmed).toBeGreaterThanOrEqual(180);
  });
});
