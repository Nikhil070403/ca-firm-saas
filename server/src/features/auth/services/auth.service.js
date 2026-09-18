const ms = require('../../../utils/parseDuration');
const AppError = require('../../../utils/AppError');
const authRepository = require('../repositories/auth.repository');
const {
  signAccessToken,
  generateRefreshTokenValue,
  hashRefreshToken,
  compareRefreshToken,
  signPurposeToken,
  verifyPurposeToken,
} = require('../../../utils/jwt');
const { sendMail } = require('../../../config/mailer');
const { verificationEmail, passwordResetEmail, welcomeEmail } = require('../../../utils/emailTemplates');
const env = require('../../../config/env');
const twoFactor = require('../../../utils/twoFactor');
const { parseUserAgent } = require('../../../utils/parseUserAgent');

const TWO_FA_LOGIN_PURPOSE = '2fa_login';

async function issueSession(user, meta = {}) {
  const rawRefreshToken = generateRefreshTokenValue();
  const tokenHash = await hashRefreshToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + ms(env.jwt.refreshExpiresIn));

  const record = await authRepository.storeRefreshToken({
    userId: user._id,
    tokenHash,
    expiresAt,
    userAgent: meta.userAgent || null,
    ipAddress: meta.ipAddress || null,
  });

  const accessToken = signAccessToken(user, record._id.toString());

  // Encode the DB record id alongside the raw secret so refresh doesn't need
  // to scan every token to find a hash match.
  const refreshToken = `${record._id}.${rawRefreshToken}`;
  return { accessToken, refreshToken };
}

async function register({ firmName, name, email, password }) {
  const existing = await authRepository.findUserByEmail(email);
  if (existing) throw AppError.conflict('An account with this email already exists');

  const firm = await authRepository.createFirm({ name: firmName });
  const passwordHash = password;
  // The person who stands up a brand-new firm workspace owns it outright —
  // they land as superadmin, then invite an admin (CA), employees and
  // clients into it from Team.
  const user = await authRepository.createUser({
    firmId: firm._id,
    name,
    email,
    passwordHash,
    role: 'superadmin',
    allowedServices: ['crm', 'khata', 'accounts'],
  });

  const verifyToken = signPurposeToken({ userId: user._id.toString() }, 'email_verification', '24h');
  const { subject, html } = verificationEmail(name, verifyToken);
  await sendMail({ to: email, subject, html });

  const session = await issueSession(user);
  return { user: user.toSafeJSON(), firm, ...session };
}

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

async function login({ email, password }, meta = {}) {
  const user = await authRepository.findUserByEmail(email, { withPassword: true });
  if (!user || !user.isActive) throw AppError.unauthorized('Invalid email or password');

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw AppError.unauthorized(`Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`);
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      await authRepository.updateUserById(user._id, {
        failedLoginAttempts: 0,
        lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
      });
      throw AppError.unauthorized('Too many failed attempts. Your account is locked for 15 minutes.');
    }
    await authRepository.updateUserById(user._id, { failedLoginAttempts: attempts });
    throw AppError.unauthorized('Invalid email or password');
  }

  if (user.twoFactor?.enabled) {
    // Password alone is not enough — hand back a short-lived, narrowly-
    // scoped token (never a real session) that only /2fa/verify-login can
    // redeem, and only for finishing THIS login.
    const tempToken = signPurposeToken({ userId: user._id.toString() }, TWO_FA_LOGIN_PURPOSE, '10m');
    return { requires2FA: true, tempToken };
  }

  await authRepository.updateUserById(user._id, { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null });
  const session = await issueSession(user, meta);
  return { user: user.toSafeJSON(), ...session };
}

async function verifyLoginTwoFactor(tempToken, code, meta = {}) {
  let decoded;
  try {
    decoded = verifyPurposeToken(tempToken, TWO_FA_LOGIN_PURPOSE);
  } catch {
    throw AppError.unauthorized('This login attempt has expired, please sign in again');
  }

  const user = await authRepository.findUserById(decoded.userId, { with2FA: true });
  if (!user || !user.isActive || !user.twoFactor?.enabled) {
    throw AppError.unauthorized('This login attempt has expired, please sign in again');
  }

  if (twoFactor.verifyToken(code, user.twoFactor.secret)) {
    await authRepository.updateUserById(user._id, { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null });
    const session = await issueSession(user, meta);
    return { user: user.toSafeJSON(), ...session };
  }

  const backupIndex = await twoFactor.matchBackupCode(code, user.twoFactor.backupCodeHashes || []);
  if (backupIndex === -1) throw AppError.unauthorized('Invalid authentication code');

  // Backup codes are single-use — consume it so it can't be replayed.
  const remainingHashes = user.twoFactor.backupCodeHashes.filter((_, i) => i !== backupIndex);
  await authRepository.updateUserById(user._id, {
    'twoFactor.backupCodeHashes': remainingHashes,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
  });
  const session = await issueSession(user, meta);
  return { user: user.toSafeJSON(), ...session };
}

async function setupTwoFactor(userId) {
  const user = await authRepository.findUserById(userId);
  if (!user) throw AppError.notFound('Account not found');
  if (user.twoFactor?.enabled) throw AppError.badRequest('Two-factor authentication is already enabled');

  const secret = twoFactor.generateSecret();
  await authRepository.updateUserById(userId, { 'twoFactor.pendingSecret': secret });
  const qrCode = await twoFactor.generateQrCode(user.email, secret);
  return { qrCode, secret };
}

async function enableTwoFactor(userId, token) {
  const user = await authRepository.findUserById(userId, { with2FA: true });
  if (!user) throw AppError.notFound('Account not found');
  if (!user.twoFactor?.pendingSecret) throw AppError.badRequest('Start setup before confirming a code');

  if (!twoFactor.verifyToken(token, user.twoFactor.pendingSecret)) {
    throw AppError.badRequest('That code is incorrect. Check your authenticator app and try again');
  }

  const backupCodes = twoFactor.generateBackupCodes();
  const backupCodeHashes = await twoFactor.hashBackupCodes(backupCodes);

  await authRepository.updateUserById(userId, {
    'twoFactor.enabled': true,
    'twoFactor.secret': user.twoFactor.pendingSecret,
    'twoFactor.pendingSecret': null,
    'twoFactor.backupCodeHashes': backupCodeHashes,
    'twoFactor.confirmedAt': new Date(),
  });

  return { backupCodes };
}

/**
 * Self-service password change from inside the app. Requires the CURRENT
 * password (a live session alone isn't proof of identity — think unattended
 * laptop), and revokes every OTHER session on success so anyone holding a
 * stolen refresh token is kicked out while this login stays alive.
 */
async function changePassword(userId, currentPassword, newPassword, currentSessionId) {
  const user = await authRepository.findUserById(userId, { withPassword: true });
  if (!user || !user.isActive) throw AppError.unauthorized('Account is inactive or no longer exists');

  const matches = await user.comparePassword(currentPassword);
  if (!matches) throw AppError.unauthorized('Current password is incorrect');

  if (currentPassword === newPassword) {
    throw AppError.badRequest('New password must be different from the current one');
  }

  const passwordHash = newPassword;
  await authRepository.updateUserById(user._id, { passwordHash });

  if (currentSessionId) {
    await authRepository.revokeOtherUserRefreshTokens(user._id, currentSessionId);
  } else {
    await authRepository.revokeAllUserRefreshTokens(user._id);
  }
}

async function listSessions(userId, currentSessionId) {
  const tokens = await authRepository.findActiveRefreshTokensForUser(userId);
  return tokens.map((t) => ({
    id: t._id,
    ...parseUserAgent(t.userAgent),
    ipAddress: t.ipAddress,
    createdAt: t.createdAt,
    isCurrent: currentSessionId ? t._id.toString() === currentSessionId : false,
  }));
}

async function revokeSession(userId, sessionId) {
  const record = await authRepository.revokeRefreshTokenForUser(sessionId, userId);
  if (!record) throw AppError.notFound('Session not found');
}

async function revokeOtherSessions(userId, currentSessionId) {
  if (!currentSessionId) throw AppError.badRequest('No current session to preserve');
  await authRepository.revokeOtherUserRefreshTokens(userId, currentSessionId);
}

async function disableTwoFactor(userId, password) {
  const user = await authRepository.findUserById(userId, { withPassword: true });
  if (!user) throw AppError.notFound('Account not found');

  const matches = await user.comparePassword(password);
  if (!matches) throw AppError.unauthorized('Incorrect password');

  await authRepository.updateUserById(userId, {
    'twoFactor.enabled': false,
    'twoFactor.secret': null,
    'twoFactor.pendingSecret': null,
    'twoFactor.backupCodeHashes': [],
    'twoFactor.confirmedAt': null,
  });
}

async function refresh(refreshTokenCookie, meta = {}) {
  if (!refreshTokenCookie || !refreshTokenCookie.includes('.')) {
    throw AppError.unauthorized('Invalid refresh token');
  }
  const [recordId, rawToken] = refreshTokenCookie.split('.');
  const record = await authRepository.findRefreshTokenById(recordId);

  if (!record || record.expiresAt < new Date()) throw AppError.unauthorized('Session expired, please log in again');

  if (record.revokedAt) {
    // Reuse of an already-rotated token is a theft signal — kill every
    // session for this user, not just this one.
    await authRepository.revokeAllUserRefreshTokens(record.userId);
    throw AppError.unauthorized('Session invalidated, please log in again');
  }

  const valid = await compareRefreshToken(rawToken, record.tokenHash);
  if (!valid) throw AppError.unauthorized('Invalid refresh token');

  const user = await authRepository.findUserById(record.userId);
  if (!user || !user.isActive) throw AppError.unauthorized('Account is inactive');

  const session = await issueSession(user, meta);
  const [newRecordId] = session.refreshToken.split('.');
  await authRepository.markRefreshTokenRotated(record._id, newRecordId);

  return { user: user.toSafeJSON(), ...session };
}

async function logout(refreshTokenCookie) {
  if (!refreshTokenCookie || !refreshTokenCookie.includes('.')) return;
  const [recordId] = refreshTokenCookie.split('.');
  await authRepository.revokeRefreshToken(recordId);
}

async function forgotPassword(email) {
  const user = await authRepository.findUserByEmail(email);
  if (!user) return; // Do not reveal whether the email exists.

  const token = signPurposeToken({ userId: user._id.toString() }, 'password_reset', '1h');
  const { subject, html } = passwordResetEmail(user.name, token);
  await sendMail({ to: user.email, subject, html });
}

async function resetPassword(token, newPassword) {
  let decoded;
  try {
    decoded = verifyPurposeToken(token, 'password_reset');
  } catch {
    throw AppError.unauthorized('Reset link is invalid or has expired');
  }

  const passwordHash = newPassword;
  const user = await authRepository.updateUserById(decoded.userId, {
    passwordHash,
    isEmailVerified: true,
  });
  if (!user) throw AppError.notFound('Account not found');
  await authRepository.revokeAllUserRefreshTokens(user._id);
}

async function verifyEmail(token) {
  let decoded;
  try {
    decoded = verifyPurposeToken(token, 'email_verification');
  } catch {
    throw AppError.unauthorized('Verification link is invalid or has expired');
  }

  const user = await authRepository.updateUserById(decoded.userId, { isEmailVerified: true });
  if (!user) throw AppError.notFound('Account not found');

  const { subject, html } = welcomeEmail(user.name, 'your firm');
  await sendMail({ to: user.email, subject, html });
  return user.toSafeJSON();
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyLoginTwoFactor,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  changePassword,
  listSessions,
  revokeSession,
  revokeOtherSessions,
};
