const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

async function connectDB() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error:', err.message));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(env.mongoUri);
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
