const { ValidationResult, isNonEmptyString } = require('../../../utils/validationHelpers');

function validateRegister(body) {
  const result = new ValidationResult(body);
  result
    .requireString('firmName', { min: 2, max: 200 })
    .requireString('name', { min: 2, max: 120 })
    .requireEmail('email');

  if (!isNonEmptyString(body.password) || body.password.length < 8) {
    result.errors.push('password must be at least 8 characters');
  }
  return result.build();
}

function validateLogin(body) {
  return new ValidationResult(body).requireEmail('email').check(isNonEmptyString(body.password), 'password is required').build();
}

function validateForgotPassword(body) {
  return new ValidationResult(body).requireEmail('email').build();
}

function validateResetPassword(body) {
  const result = new ValidationResult(body).check(isNonEmptyString(body.token), 'token is required');
  if (!isNonEmptyString(body.password) || body.password.length < 8) {
    result.errors.push('password must be at least 8 characters');
  }
  return result.build();
}

function validateVerifyEmail(body) {
  return new ValidationResult(body).check(isNonEmptyString(body.token), 'token is required').build();
}

function validateUpdateMe(body) {
  const result = new ValidationResult(body);
  if (body.name !== undefined) result.requireString('name', { min: 2, max: 120 });
  if (body.phone !== undefined) result.optionalString('phone', { max: 30 });
  return result.build();
}

function validateChangePassword(body) {
  const result = new ValidationResult(body)
    .check(isNonEmptyString(body.currentPassword), 'currentPassword is required');
  if (!isNonEmptyString(body.newPassword) || body.newPassword.length < 8) {
    result.errors.push('newPassword must be at least 8 characters');
  }
  return result.build();
}

function validateEnableTwoFactor(body) {
  return new ValidationResult(body).check(isNonEmptyString(body.token), 'token is required').build();
}

function validateDisableTwoFactor(body) {
  return new ValidationResult(body).check(isNonEmptyString(body.password), 'password is required').build();
}

function validateVerifyLoginTwoFactor(body) {
  return new ValidationResult(body)
    .check(isNonEmptyString(body.tempToken), 'tempToken is required')
    .check(isNonEmptyString(body.code), 'code is required')
    .build();
}

module.exports = {
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
};
