import request from 'supertest';
import { app } from '../app.js';
import { setupTestDB } from './setup.js';
import { UserRole } from '../types/index.js';
import { User } from '../modules/users/user.model.js';
import { ensureBootstrapAdmin } from '../config/seed.js';

setupTestDB();

describe('Auth Module & Role Authorization Tests', () => {
  const driverData = {
    name: 'John Driver',
    email: 'driver@test.com',
    phone: '+919876543210',
    role: 'driver',
    password: 'Password123',
  };

  const ownerData = {
    name: 'Alice Host',
    email: 'owner@test.com',
    phone: '+919876543211',
    role: 'owner',
    password: 'Password123',
  };

  it('should successfully register a DRIVER', async () => {
    const res = await request(app).post('/api/auth/register').send(driverData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(driverData.email);
    expect(res.body.user.role).toBe('driver');
    const savedUser = await User.findOne({ email: driverData.email });
    expect(savedUser?.passwordHash).not.toBe(driverData.password);
    expect(await savedUser?.comparePassword(driverData.password)).toBe(true);
  });

  it('should successfully register an OWNER', async () => {
    const res = await request(app).post('/api/auth/register').send(ownerData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('owner');
  });

  it('should disallow public registration as ADMIN', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hacker Admin',
      email: 'hacker@test.com',
      role: 'admin',
      password: 'Password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject attempts to assign an admin role through registration or login payloads', async () => {
    const registration = await request(app).post('/api/auth/register').send({ ...driverData, email: 'role-escalation@test.com', role: 'admin' });
    expect(registration.status).toBe(400);

    await request(app).post('/api/auth/register').send(driverData);
    const login = await request(app).post('/api/auth/login').send({ email: driverData.email, password: driverData.password, role: 'admin' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('driver');

    const forbidden = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${login.body.token}`);
    expect(forbidden.status).toBe(403);
  });

  it('should reject a JWT whose role claim was changed by the client', async () => {
    await request(app).post('/api/auth/register').send(driverData);
    const login = await request(app).post('/api/auth/login').send({ email: driverData.email, password: driverData.password });
    const [header, payload, signature] = login.body.token.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    claims.role = UserRole.ADMIN;
    const changedToken = `${header}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.${signature}`;
    const response = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${changedToken}`);
    expect(response.status).toBe(401);
  });

  it('should allow an administrator created by a trusted server process to log in', async () => {
    const password = 'TrustedAdmin123';
    await ensureBootstrapAdmin({
      name: 'Trusted Admin', email: 'trusted-admin@test.com', password,
    });
    const login = await request(app).post('/api/auth/login').send({ email: 'trusted-admin@test.com', password });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('admin');
    const stats = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${login.body.token}`);
    expect(stats.status).toBe(200);
  });

  it('should prevent a user from reading another account profile', async () => {
    const first = await request(app).post('/api/auth/register').send(driverData);
    const second = await request(app).post('/api/auth/register').send({ ...driverData, email: 'other-driver@test.com' });
    const response = await request(app).get(`/api/users/${second.body.user.id}`).set('Authorization', `Bearer ${first.body.token}`);
    expect(response.status).toBe(403);
  });

  it('should ignore role and status changes in profile update requests', async () => {
    const login = await request(app).post('/api/auth/register').send(driverData);
    const response = await request(app).patch('/api/users/profile')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ name: 'Updated Driver', role: 'admin', accountStatus: 'ACTIVE' });
    expect(response.status).toBe(200);
    expect(response.body.data.role).toBe('driver');
    const adminRoute = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${login.body.token}`);
    expect(adminRoute.status).toBe(403);
  });

  it('should prevent owners from creating driver reservations', async () => {
    const owner = await request(app).post('/api/auth/register').send(ownerData);
    const response = await request(app).post('/api/bookings').set('Authorization', `Bearer ${owner.body.token}`).send({});
    expect(response.status).toBe(403);
  });

  it('should reject registration with duplicate email', async () => {
    await request(app).post('/api/auth/register').send(driverData);

    const res = await request(app).post('/api/auth/register').send(driverData);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should authenticate user with valid credentials', async () => {
    await request(app).post('/api/auth/register').send(driverData);

    const res = await request(app).post('/api/auth/login').send({
      email: driverData.email,
      password: driverData.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(driverData.email);
  });

  it('should authenticate owner accounts and preserve their database role', async () => {
    await request(app).post('/api/auth/register').send(ownerData);
    const res = await request(app).post('/api/auth/login').send({ email: ownerData.email, password: ownerData.password });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('owner');
    const profile = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(profile.status).toBe(200);
    expect(profile.body.user.role).toBe('owner');
  });

  it('should reject login with incorrect password', async () => {
    await request(app).post('/api/auth/register').send(driverData);

    const res = await request(app).post('/api/auth/login').send({
      email: driverData.email,
      password: 'WrongPassword123',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return profile for authenticated user via /auth/me', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(driverData);
    const token = registerRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(driverData.email);
  });

  it('should reject unauthenticated request to protected endpoint', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
