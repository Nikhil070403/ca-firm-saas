const asyncHandler = require('../../../utils/asyncHandler');
const AppError = require('../../../utils/AppError');
const User = require('../../auth/models/User.model');

/**
 * `req.user` from requireAuth is built purely from JWT claims (id/role/
 * firmId) — deliberately stateless, per auth.middleware.js. `linkedClientId`
 * isn't in that token, so the portal (which must always check the CURRENT
 * link, not a snapshot from whenever the token was issued — an admin
 * relinking a client account must take effect immediately, not after the
 * next login) loads the live User record here and merges it in. Also
 * re-confirms role==='client' against the database, not just the token.
 */
const requirePortalUser = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id, isDeleted: false });
  if (!user || !user.isActive) throw AppError.unauthorized('Account is inactive or no longer exists');
  if (user.role !== 'client') throw AppError.forbidden('The Client Portal is only available to client accounts');

  req.user.linkedClientId = user.linkedClientId;
  next();
});

module.exports = requirePortalUser;
