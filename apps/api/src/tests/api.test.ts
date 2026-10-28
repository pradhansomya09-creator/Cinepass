import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import prisma from '../config/db';

const app = createApp();

describe('CinePass Backend API Test Suite', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Health Check
  it('GET /health should return 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  // 2. Authentication: Login with seeded admin
  it('POST /api/v1/auth/login should authenticate seeded admin user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@cinepass.com',
      password: 'AdminPassword@123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.accessToken).toBeDefined();
  });

  // 3. Authentication: Invalid credentials rejection
  it('POST /api/v1/auth/login should reject invalid password with 401', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@cinepass.com',
      password: 'WrongPasswordXYZ',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 4. Movies: List and search movies
  it('GET /api/v1/movies should return seeded movies with pagination', async () => {
    const res = await request(app).get('/api/v1/movies?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(6);
  });

  // 5. Movies: Search filter
  it('GET /api/v1/movies?search=Oppenheimer should filter specifically', async () => {
    const res = await request(app).get('/api/v1/movies?search=Oppenheimer');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Oppenheimer');
  });

  // 6. Shows & Seats: Retrieve shows and real-time seat map
  it('GET /api/v1/shows and GET /api/v1/shows/:id/seats should return real-time seat inventory', async () => {
    const showsRes = await request(app).get('/api/v1/shows');
    expect(showsRes.status).toBe(200);
    expect(showsRes.body.data.length).toBeGreaterThan(0);

    const firstShow = showsRes.body.data[0];
    const seatsRes = await request(app).get(`/api/v1/shows/${firstShow.id}/seats`);

    expect(seatsRes.status).toBe(200);
    expect(seatsRes.body.data.showId).toBe(firstShow.id);
    expect(seatsRes.body.data.totalSeats).toBeGreaterThan(0);
    expect(seatsRes.body.data.rows).toBeDefined();
  });

  // 7. Authorization: Protected admin endpoint rejects guest
  it('GET /api/v1/admin/dashboard should reject unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
  });

  // 8. Coupons: Validation of seeded coupon
  it('POST /api/v1/coupons/validate should compute discount correctly for authenticated user', async () => {
    // Login as registered user first
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'ashish@example.com',
      password: 'UserPassword@123',
    });
    const token = loginRes.body.data.accessToken;

    const showsRes = await request(app).get('/api/v1/shows');
    const firstShow = showsRes.body.data[0];

    const couponRes = await request(app)
      .post('/api/v1/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'FLAT100',
        showId: firstShow.id,
        subtotal: 700,
      });

    expect(couponRes.status).toBe(200);
    expect(couponRes.body.data.discountAmount).toBe(100);
    expect(couponRes.body.data.finalAmount).toBe(600);
  });
});
