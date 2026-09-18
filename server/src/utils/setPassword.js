require('../models/registerModels');

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../features/auth/models/User.model');
const logger = require('./logger');

/**
 * Dev/demo utility: set a user's password from the command line. Stored in
 * plain text (demo build) — you can also just edit `passwordHash` by hand in
 * Compass since login compares the raw value.
 *
 * Usage: npm run set-password -- <email> <newPassword>
 */
async function run() {
  const [email, newPassword] = process.argv.slice(2);
  if (!email || !newPassword) {
    logger.error('Usage: npm run set-password -- <email> <newPassword>');
    process.exit(1);
  }

  await connectDB();
  const passwordHash = newPassword;
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase(), isDeleted: false },
    { $set: { passwordHash } }
  );

  if (!user) {
    logger.error(`No user found with email ${email}`);
  } else {
    logger.info(`Password updated for ${email}`);
  }
  await disconnectDB();
}

run().catch((err) => {
  logger.error('set-password failed:', err.message);
  process.exit(1);
});
