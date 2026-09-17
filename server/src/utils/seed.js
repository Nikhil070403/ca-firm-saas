require('../models/registerModels');

const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const Firm = require('../features/settings/models/Firm.model');
const User = require('../features/auth/models/User.model');
const logger = require('./logger');

async function seed() {
  await connectDB();

  const existing = await User.findOne({ email: env.seed.adminEmail });
  if (existing) {
    logger.info(`Seed admin already exists (${env.seed.adminEmail}) — nothing to do`);
    await disconnectDB();
    return;
  }

  const firm = await Firm.create({ name: env.seed.firmName });
  const passwordHash = await bcrypt.hash(env.seed.adminPassword, 12);
  await User.create({
    firmId: firm._id,
    name: 'Super Admin',
    email: env.seed.adminEmail,
    passwordHash,
    role: 'superadmin',
    allowedServices: ['crm', 'khata', 'accounts'],
    isEmailVerified: true,
  });

  logger.info(`Seeded firm "${firm.name}" with superadmin ${env.seed.adminEmail} / ${env.seed.adminPassword}`);
  await disconnectDB();
}

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
