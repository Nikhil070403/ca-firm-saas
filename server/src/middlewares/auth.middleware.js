const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../features/auth/models/User.model');

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  return null;
}

/**
 * Verifies the access token and attaches `req.user` = { id, role, firmId }.
 * Deliberately does NOT hit the DB on every request (would defeat the point
 * of a stateless access token) — it trusts the JWT claims. Anything that
 * needs the live User document should load it explicitly in that route.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw AppError.unauthorized('Authentication token missing');

  const decoded = verifyAccessToken(token);
  req.user = { id: decoded.userId, role: decoded.role, firmId: decoded.firmId, sessionId: decoded.sessionId };
  next();
});

// Use when a route needs the up-to-date user record (e.g. to check isActive)
// rather than just trusting stale JWT claims.
const loadCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id, isDeleted: false }).select('+passwordHash');
  if (!user || !user.isActive) throw AppError.unauthorized('Account is inactive or no longer exists');
  req.currentUser = user;
  next();
});

module.exports = { requireAuth, loadCurrentUser };
