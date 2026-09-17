const AppError = require('../utils/AppError');

/**
 * Runs a plain validator function (no Zod/Joi — see PROJECT_STATE.md stack
 * pivot) against req.body. The validator must return { isValid, errors, value }
 * where `value` is the sanitized/coerced body to use downstream.
 */
function validate(validatorFn) {
  return function validateMiddleware(req, res, next) {
    const result = validatorFn(req.body);
    if (!result.isValid) {
      return next(AppError.validation('Validation failed', result.errors));
    }
    req.body = result.value ?? req.body;
    next();
  };
}

module.exports = validate;
