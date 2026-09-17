/**
 * Wraps an async route/controller so a rejected promise reaches Express's
 * error-handling middleware instead of crashing the process. Controllers
 * never need their own try/catch for business-logic errors.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
