import request from 'supertest';
import { app } from '../app.js';
import { setupTestDB } from './setup.js';
import { UserRole } from '../types/index.js';

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
