const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../../../middlewares/validate.middleware');
const { requireAuth } = require('../../../middlewares/auth.middleware');
const { authLimiter } = require('../../../middlewares/rateLimiter.middleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateUpdateMe,
  validateChangePassword,
  validateEnableTwoFactor,
  validateDisableTwoFactor,
  validateVerifyLoginTwoFactor,
} = require('../validators/auth.validator');

const router = Router();

router.post('/register', authLimiter, validate(validateRegister), controller.register);
router.post('/login', authLimiter, validate(validateLogin), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/forgot-password', authLimiter, validate(validateForgotPassword), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(validateResetPassword), controller.resetPassword);
router.post('/verify-email', validate(validateVerifyEmail), controller.verifyEmail);
router.get('/me', requireAuth, controller.me);
router.patch('/me', requireAuth, validate(validateUpdateMe), controller.updateMe);
// Rate-limited like login: it takes a password guess as input.
router.post('/change-password', authLimiter, requireAuth, validate(validateChangePassword), controller.changePassword);

// 2FA: setup/enable/disable are self-service (the acting user's own
// account); verify-login is deliberately public — the caller only has a
// short-lived tempToken from /login, not a real session yet.
router.post('/2fa/setup', requireAuth, controller.setupTwoFactor);
router.post('/2fa/enable', requireAuth, validate(validateEnableTwoFactor), controller.enableTwoFactor);
router.post('/2fa/disable', requireAuth, validate(validateDisableTwoFactor), controller.disableTwoFactor);
router.post('/2fa/verify-login', authLimiter, validate(validateVerifyLoginTwoFactor), controller.verifyLoginTwoFactor);

router.get('/sessions', requireAuth, controller.listSessions);
router.delete('/sessions/:id', requireAuth, controller.revokeSession);
router.post('/sessions/revoke-others', requireAuth, controller.revokeOtherSessions);

module.exports = router;
