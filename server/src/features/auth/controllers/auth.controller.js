const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const authService = require('../services/auth.service');
const authRepository = require('../repositories/auth.repository');
const AppError = require('../../../utils/AppError');
const env = require('../../../config/env');

const REFRESH_COOKIE = 'refreshToken';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    // Host-only unless COOKIE_DOMAIN is explicitly set (see config/env.js).
    domain: (env.nodeEnv === 'production' && env.cookieDomain) ? env.cookieDomain : undefined,
    // Deliberately NO maxAge: a session cookie dies when the browser fully
    // closes, which backs the client's logout-on-tab-close policy. The DB
    // record's expiresAt (JWT_REFRESH_EXPIRES_IN) still bounds token life
    // server-side even if the browser keeps the cookie alive via restore.
    path: '/api/v1/auth',
  };
}

function requestMeta(req) {
  return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
}

function setSessionCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
}

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  setSessionCookie(res, result.refreshToken);
  return ApiResponse.created(res, {
    message: 'Account created. Please check your email to verify your address.',
    data: { user: result.user, accessToken: result.accessToken },
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, requestMeta(req));
  if (result.requires2FA) {
    return ApiResponse.success(res, {
      message: 'Enter your two-factor authentication code',
      data: { requires2FA: true, tempToken: result.tempToken },
    });
  }
  setSessionCookie(res, result.refreshToken);
  return ApiResponse.success(res, {
    message: 'Logged in successfully',
    data: { user: result.user, accessToken: result.accessToken },
  });
});

const verifyLoginTwoFactor = asyncHandler(async (req, res) => {
  const result = await authService.verifyLoginTwoFactor(req.body.tempToken, req.body.code, requestMeta(req));
  setSessionCookie(res, result.refreshToken);
  return ApiResponse.success(res, {
    message: 'Logged in successfully',
    data: { user: result.user, accessToken: result.accessToken },
  });
});

const setupTwoFactor = asyncHandler(async (req, res) => {
  const result = await authService.setupTwoFactor(req.user.id);
  return ApiResponse.success(res, { data: result });
});

const enableTwoFactor = asyncHandler(async (req, res) => {
  const result = await authService.enableTwoFactor(req.user.id, req.body.token);
  return ApiResponse.success(res, {
    message: 'Two-factor authentication enabled',
    data: { backupCodes: result.backupCodes },
  });
});

const disableTwoFactor = asyncHandler(async (req, res) => {
  await authService.disableTwoFactor(req.user.id, req.body.password);
  return ApiResponse.success(res, { message: 'Two-factor authentication disabled' });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword, req.user.sessionId);
  return ApiResponse.success(res, { message: 'Password changed. Other sessions have been signed out.' });
});

const listSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.listSessions(req.user.id, req.user.sessionId);
  return ApiResponse.success(res, { data: { sessions } });
});

const revokeSession = asyncHandler(async (req, res) => {
  await authService.revokeSession(req.user.id, req.params.id);
  return ApiResponse.success(res, { message: 'Session signed out' });
});

const revokeOtherSessions = asyncHandler(async (req, res) => {
  await authService.revokeOtherSessions(req.user.id, req.user.sessionId);
  return ApiResponse.success(res, { message: 'Signed out of all other sessions' });
});

const refresh = asyncHandler(async (req, res) => {
  const cookie = req.cookies?.[REFRESH_COOKIE];
  const result = await authService.refresh(cookie, requestMeta(req));
  setSessionCookie(res, result.refreshToken);
  return ApiResponse.success(res, {
    message: 'Session refreshed',
    data: { user: result.user, accessToken: result.accessToken },
  });
});

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(cookie);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  return ApiResponse.success(res, { message: 'Logged out' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  return ApiResponse.success(res, { message: 'If that email exists, a reset link has been sent' });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  return ApiResponse.success(res, { message: 'Password reset successfully' });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.body.token);
  return ApiResponse.success(res, { message: 'Email verified', data: { user } });
});

const me = asyncHandler(async (req, res) => {
  const user = await authRepository.findUserById(req.user.id);
  if (!user) throw AppError.notFound('User not found');
  return ApiResponse.success(res, { data: { user: user.toSafeJSON() } });
});

// Self-service profile update — deliberately separate from PATCH /users/:id
// (admin-only team management) so any authenticated user can edit their own
// name/phone/avatar without needing the admin-only user:update capability.
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, avatarUrl } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const user = await authRepository.updateUserById(req.user.id, updates);
  if (!user) throw AppError.notFound('User not found');
  return ApiResponse.success(res, { message: 'Profile updated', data: { user: user.toSafeJSON() } });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  me,
  updateMe,
  verifyLoginTwoFactor,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  changePassword,
  listSessions,
  revokeSession,
  revokeOtherSessions,
};
