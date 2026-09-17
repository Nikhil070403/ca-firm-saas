const { ValidationResult, isArray, isNonEmptyString } = require('../../../utils/validationHelpers');

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function validateCreateTemplate(body) {
  const result = new ValidationResult(body).requireString('name', { min: 2, max: 150 });
  if (body.defaultPriority !== undefined) result.requireEnum('defaultPriority', PRIORITIES);
  if (body.description !== undefined) result.optionalString('description', { max: 1000 });
  if (body.checklistItems !== undefined) {
    result.check(
      isArray(body.checklistItems) && body.checklistItems.every((item) => isNonEmptyString(item)),
      'checklistItems must be an array of non-empty strings'
    );
  }
  return result.build();
}

function validateApplyTemplate(body) {
  const result = new ValidationResult(body);
  if (body.clientId !== undefined) result.optionalObjectId('clientId');
  if (body.assignedTo !== undefined) result.optionalObjectId('assignedTo');
  if (body.title !== undefined) result.optionalString('title', { max: 200 });
  return result.build();
}

module.exports = { validateCreateTemplate, validateApplyTemplate };
