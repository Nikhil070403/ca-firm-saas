const RefreshToken = require('../features/auth/models/RefreshToken.model');
const logger = require('../utils/logger');

/**
 * Runs daily. The TTL index on RefreshToken.expiresAt already removes
 * expired documents eventually, but Mongo's TTL sweep runs on its own
 * ~60s cadence — this also proactively clears anything revoked more than
 * 30 days ago so the collection doesn't accumulate dead rows between sweeps.
 */
async function run() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await RefreshToken.deleteMany({ revokedAt: { $ne: null, $lt: cutoff } });
  if (result.deletedCount > 0) logger.info(`cleanupRefreshTokens: removed ${result.deletedCount} token(s)`);
}

module.exports = { run };
