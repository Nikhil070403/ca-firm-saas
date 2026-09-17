const { ValidationResult } = require('../../../utils/validationHelpers');
const User = require('../../auth/models/User.model');

function validateAllowedServices(result, body) {
  if (body.allowedServices === undefined) return;
  const valid = Array.isArray(body.allowedServices)
    && body.allowedServices.every((s) => User.SERVICES.includes(s));
  result.check(valid, `allowedServices must be an array containing only: ${User.SERVICES.join(', ')}`);
}

function validateLinkedClientId(result, body) {
  if (body.linkedClientId === undefined || body.linkedClientId === null) return;
  result.optionalObjectId('linkedClientId');
}

function validateDepartmentId(result, body) {
  if (body.departmentId === undefined || body.departmentId === null) return;
  result.optionalObjectId('departmentId');
}

function validateCreateUser(body) {
  const result = new ValidationResult(body)
    .requireString('name', { min: 2, max: 120 })
    .requireEmail('email')
    .requireEnum('role', User.ROLES);
  validateAllowedServices(result, body);
  validateLinkedClientId(result, body);
  validateDepartmentId(result, body);
  return result.build();
}

function validateUpdateUser(body) {
  const result = new ValidationResult(body);
  if (body.name !== undefined) result.requireString('name', { min: 2, max: 120 });
  if (body.email !== undefined) result.requireEmail('email');
  if (body.role !== undefined) result.requireEnum('role', User.ROLES);
  if (body.phone !== undefined) result.optionalString('phone', { max: 30 });
  // Optional admin password reset — empty string means "not changing it".
  if (body.password !== undefined && body.password !== '' && body.password !== null) {
    result.check(typeof body.password === 'string' && body.password.length >= 8, 'password must be at least 8 characters');
  }
  validateAllowedServices(result, body);
  validateLinkedClientId(result, body);
  validateDepartmentId(result, body);
  return result.build();
}

module.exports = { validateCreateUser, validateUpdateUser };
