const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Translates common non-AppError failures (bad ObjectId, Mongoose
// validation, duplicate key) into the same operational-error shape so the
// client never sees a raw stack trace or driver error message.
function normalizeError(err) {
  if (err instanceof AppError) return err;

  if (err.name === 'CastError') {
    return AppError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return AppError.validation('Validation failed', details);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return AppError.conflict(`${field} already exists`, err.keyValue);
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return AppError.unauthorized('Invalid or expired session');
  }

  return new AppError(err.message || 'Something went wrong', 500, 'INTERNAL_ERROR');
}

// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, next) {
  const normalized = normalizeError(err);

  if (!normalized.isOperational || normalized.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err.stack || err.message);
  }

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    data: null,
    error: {
      code: normalized.code,
      details: normalized.details,
    },
  });
}

module.exports = { notFoundHandler, globalErrorHandler };
