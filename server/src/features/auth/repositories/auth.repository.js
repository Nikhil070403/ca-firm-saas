const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const Firm = require('../../settings/models/Firm.model');

/**
 * Auth deliberately does NOT go through BaseRepository — login/signup/reset
 * happen before we know which firm a request belongs to, so these queries
 * are intentionally not firm-scoped. Every other module's repository must
 * still extend BaseRepository.
 */
const authRepository = {
  createFirm(data) {
    return Firm.create(data);
  },

  createUser(data) {
    return User.create(data);
  },

  findUserByEmail(email, { withPassword = false } = {}) {
    const query = User.findOne({ email: email.toLowerCase(), isDeleted: false });
    return withPassword ? query.select('+passwordHash') : query;
  },

  findUserById(id, { withPassword = false, with2FA = false } = {}) {
    const query = User.findOne({ _id: id, isDeleted: false });
    if (withPassword) query.select('+passwordHash');
    if (with2FA) query.select('+twoFactor.secret +twoFactor.pendingSecret +twoFactor.backupCodeHashes');
    return query;
  },

  updateUserById(id, updates) {
    return User.findByIdAndUpdate(id, { $set: updates }, { new: true });
  },

  async storeRefreshToken({ userId, tokenHash, expiresAt, userAgent, ipAddress }) {
    return RefreshToken.create({ userId, tokenHash, expiresAt, userAgent, ipAddress });
  },

  findRefreshTokenById(id) {
    return RefreshToken.findById(id);
  },

  findActiveRefreshTokensForUser(userId) {
    return RefreshToken.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  },

  markRefreshTokenRotated(id, replacedById) {
    return RefreshToken.findByIdAndUpdate(id, { revokedAt: new Date(), replacedBy: replacedById });
  },

  revokeRefreshToken(id) {
    return RefreshToken.findByIdAndUpdate(id, { revokedAt: new Date() });
  },

  // Ownership-checked revoke — a user's "sessions" list must never let them
  // (or a forged request) revoke a token belonging to someone else.
  revokeRefreshTokenForUser(id, userId) {
    return RefreshToken.findOneAndUpdate({ _id: id, userId, revokedAt: null }, { revokedAt: new Date() }, { new: true });
  },

  revokeAllUserRefreshTokens(userId) {
    return RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
  },

  revokeOtherUserRefreshTokens(userId, exceptId) {
    return RefreshToken.updateMany(
      { userId, revokedAt: null, _id: { $ne: exceptId } },
      { revokedAt: new Date() }
    );
  },
};

module.exports = authRepository;
