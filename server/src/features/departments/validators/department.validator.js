const { ValidationResult } = require('../../../utils/validationHelpers');

function validateCreateDepartment(body) {
  const result = new ValidationResult(body).requireString('name', { min: 2, max: 100 });
  if (body.headUserId !== undefined && body.headUserId !== null) result.optionalObjectId('headUserId');
  return result.build();
}

module.exports = { validateCreateDepartment };
