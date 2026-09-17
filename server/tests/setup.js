const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EMAIL_SECRET = 'test-email-secret';

let mongod;

// Runs before any test file's own beforeAll — MONGO_URI must be set here,
// before config/env.js is ever require()'d, since env.js reads
// process.env once at module-load time and caches the result.
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
});

afterAll(async () => {
  const mongoose = require('mongoose');
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
