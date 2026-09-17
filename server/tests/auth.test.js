const request = require('supertest');

let app;

beforeAll(async () => {
  require('../src/models/registerModels');
  const { connectDB } = require('../src/config/db');
  await connectDB();
  app = require('../src/app');
});

describe('Auth flow', () => {
  const credentials = {
    firmName: 'Test & Co',
    name: 'Test Admin',
    email: 'admin@testco.example',
    password: 'SuperSecret123',
  };

  it('registers a new firm + admin user and returns an access token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(credentials.email);
    // Registering a brand-new firm makes you its superadmin (the owner);
    // admin/employee/client accounts are then invited from Team.
    expect(res.body.data.user.role).toBe('superadmin');
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects registering the same email twice', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(credentials);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it('rejects login with the wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects /auth/me without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    const token = login.body.data.accessToken;

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(credentials.email);
  });
});
