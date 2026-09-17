const request = require('supertest');

let app;
let accessToken;

beforeAll(async () => {
  require('../src/models/registerModels');
  const { connectDB } = require('../src/config/db');
  await connectDB();
  app = require('../src/app');

  const res = await request(app).post('/api/v1/auth/register').send({
    firmName: 'Client Test Firm',
    name: 'Owner',
    email: 'owner@clienttest.example',
    password: 'SuperSecret123',
  });
  accessToken = res.body.data.accessToken;
});

function authed(req) {
  return req.set('Authorization', `Bearer ${accessToken}`);
}

describe('Client CRUD', () => {
  let clientId;

  it('rejects creating a client without auth', async () => {
    const res = await request(app).post('/api/v1/clients').send({ displayName: 'Acme LLP' });
    expect(res.status).toBe(401);
  });

  it('creates a client', async () => {
    const res = await authed(request(app).post('/api/v1/clients')).send({ displayName: 'Acme LLP', firmType: 'llp' });

    expect(res.status).toBe(201);
    expect(res.body.data.client.displayName).toBe('Acme LLP');
    clientId = res.body.data.client._id;
  });

  it('lists clients with pagination metadata', async () => {
    const res = await authed(request(app).get('/api/v1/clients'));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('fetches a single client by id', async () => {
    const res = await authed(request(app).get(`/api/v1/clients/${clientId}`));
    expect(res.status).toBe(200);
    expect(res.body.data.client._id).toBe(clientId);
  });

  it('updates a client', async () => {
    const res = await authed(request(app).patch(`/api/v1/clients/${clientId}`)).send({ status: 'inactive' });
    expect(res.status).toBe(200);
    expect(res.body.data.client.status).toBe('inactive');
  });

  it('soft-deletes a client, after which it 404s on lookup', async () => {
    const del = await authed(request(app).delete(`/api/v1/clients/${clientId}`));
    expect(del.status).toBe(200);

    const getAfterDelete = await authed(request(app).get(`/api/v1/clients/${clientId}`));
    expect(getAfterDelete.status).toBe(404);
  });

  it('404s for a well-formed id that does not exist', async () => {
    const res = await authed(request(app).get('/api/v1/clients/507f1f77bcf86cd799439011'));
    expect(res.status).toBe(404);
  });
});
