const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

// sessionId ties the access token to the RefreshToken record it was issued
// alongside — not sensitive (it's just an ObjectId), carried so the
// sessions UI can tell "this device" apart from a user's other logins
// without hitting the DB on every request.
function signAccessToken(user, sessionId) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role, firmId: user.firmId.toString(), sessionId },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

// Refresh tokens are opaque random strings, not JWTs — only their bcrypt
// hash is stored (see RefreshToken.model.js), so a DB read alone can't
// mint a session.
function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString('hex');
}

async function hashRefreshToken(rawToken) {
  return bcrypt.hash(rawToken, 10);
}

async function compareRefreshToken(rawToken, hash) {
  return bcrypt.compare(rawToken, hash);
}

function signPurposeToken(payload, purpose, expiresIn = '1h') {
  return jwt.sign({ ...payload, purpose }, env.jwt.emailSecret, { expiresIn });
}

function verifyPurposeToken(token, expectedPurpose) {
  const decoded = jwt.verify(token, env.jwt.emailSecret);
  if (decoded.purpose !== expectedPurpose) {
    throw new Error('Token purpose mismatch');
  }
  return decoded;
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshTokenValue,
  hashRefreshToken,
  compareRefreshToken,
  signPurposeToken,
  verifyPurposeToken,
};
