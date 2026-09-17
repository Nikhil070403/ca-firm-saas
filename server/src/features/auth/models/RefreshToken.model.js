const mongoose = require('mongoose');

/**
 * We never store the raw refresh token — only a bcrypt hash of it — so a DB
 * leak alone can't be used to mint sessions. `replacedBy` lets us detect
 * reuse of an already-rotated token (a theft signal), at which point the
 * whole family should be revoked by the auth service.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true },
    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RefreshToken',
      default: null,
    },
  },
  { timestamps: true }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
