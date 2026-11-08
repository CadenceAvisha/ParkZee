import request from 'supertest';
import { app } from '../app.js';
import { setupTestDB } from './setup.js';
import { User } from '../modules/users/user.model.js';
import { UserRole, AccountStatus } from '../types/index.js';
import { generateAccessToken } from '../utils/token.js';
import bcrypt from 'bcryptjs';

setupTestDB();

describe('Parking Module & Geospatial Discovery Tests', () => {
  let ownerToken: string;
  let ownerId: string;
  let otherOwnerToken: string;
  let otherOwnerId: string;
  let adminToken: string;

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('Password123', 10);

    // Create Owner 1
    const owner = await User.create({
      name: 'Owner Alice',
      email: 'alice@test.com',
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

    // Create Owner 2
    const otherOwner = await User.create({
      name: 'Owner Bob',
      email: 'bob@test.com',
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

    // Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@parkzee.com',
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      passwordHash,
    });
    adminToken = generateAccessToken({
      userId: admin._id.toString(),
      email: admin.email,
      role: UserRole.ADMIN,
      name: admin.name,
    });
  });

  const validListingData = {
    name: 'Brigade Metro Smart Garage',
    description: 'Secured CCTV-monitored parking space 50m from metro station.',
    address: 'MG Road, Sector 4',
    city: 'Bengaluru',
    postalCode: '560001',
    latitude: 12.9716,
    longitude: 77.5946,
    supportedVehicleTypes: ['car', 'suv', 'ev'],
    parkingType: 'covered',
    totalCapacity: 5,
    pricePerHour: 40,
    openTime: '06:00',
    closeTime: '23:00',
    is24x7: false,
    openDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    amenities: ['CCTV', 'Covered Roof'],
    photos: ['https://example.com/garage.jpg'],
  };

  it('should allow OWNER to create a parking listing in PENDING status', async () => {
    const res = await request(app)
      .post('/api/parking')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validListingData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(validListingData.name);
    expect(res.body.data.verificationStatus).toBe('pending');
    expect(res.body.data.isActive).toBe(false);
  });

  it('should not show unapproved pending listings in public search', async () => {
    await request(app)
      .post('/api/parking')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validListingData);

    const res = await request(app).get('/api/parking/search').query({
      locationQuery: 'MG Road',
    });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.data.length).toBe(0);
  });

  it('should allow ADMIN to approve listing and activate it for discovery', async () => {
    const createRes = await request(app)
      .post('/api/parking')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validListingData);

    const listingId = createRes.body.data.id;

    // Admin verifies listing
    const verifyRes = await request(app)
      .patch(`/api/parking/${listingId}/verification`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verificationStatus).toBe('approved');
    expect(verifyRes.body.data.isActive).toBe(true);

    // Search should now find it
    const searchRes = await request(app).get('/api/parking/search').query({
      locationQuery: 'Bengaluru',
    });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].id).toBe(listingId);
  });

  it('should perform geospatial nearby search within radius', async () => {
    // Create & approve listing at MG Road (12.9716, 77.5946)
    const createRes = await request(app)
      .post('/api/parking')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validListingData);

    const listingId = createRes.body.data.id;
    await request(app)
      .patch(`/api/parking/${listingId}/verification`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    // Search from nearby point (12.9720, 77.5950) with 5km radius
    const searchRes = await request(app).get('/api/parking/search').query({
      latitude: 12.9720,
      longitude: 77.5950,
      radiusKm: 5,
    });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].distanceKm).toBeDefined();
    expect(searchRes.body.data[0].distanceKm).toBeLessThan(1);
  });

  it('should prevent IDOR: another owner cannot update or delete listing', async () => {
    const createRes = await request(app)
      .post('/api/parking')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validListingData);

    const listingId = createRes.body.data.id;

    // Bob attempts to modify Alice's listing
    const updateRes = await request(app)
      .put(`/api/parking/${listingId}`)
      .set('Authorization', `Bearer ${otherOwnerToken}`)
      .send({ pricePerHour: 999 });

    expect(updateRes.status).toBe(403);

    // Bob attempts to delete Alice's listing
    const deleteRes = await request(app)
      .delete(`/api/parking/${listingId}`)
      .set('Authorization', `Bearer ${otherOwnerToken}`);

    expect(deleteRes.status).toBe(403);
  });
});
