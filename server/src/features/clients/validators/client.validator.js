const { ValidationResult, isArray, isNonEmptyString, isObjectId } = require('../../../utils/validationHelpers');

const FIRM_TYPES = ['individual', 'proprietorship', 'partnership', 'llp', 'private_limited', 'public_limited', 'huf', 'trust', 'other'];
const STATUSES = ['active', 'inactive', 'archived'];

function validateContactPersons(result) {
  const { contactPersons } = result.value;
  if (contactPersons === undefined) return;
  if (!isArray(contactPersons)) {
    result.errors.push('contactPersons must be an array');
    return;
  }
  contactPersons.forEach((person, idx) => {
    if (!isNonEmptyString(person?.name)) {
      result.errors.push(`contactPersons[${idx}].name is required`);
    }
  });
}

function validateCreateClient(body) {
  const result = new ValidationResult(body)
    .requireString('displayName', { min: 2, max: 200 })
    .optionalObjectId('assignedTo');

  if (body.firmType !== undefined) result.requireEnum('firmType', FIRM_TYPES);
  validateContactPersons(result);
  return result.build();
}

function validateUpdateClient(body) {
  const result = new ValidationResult(body);
  if (body.displayName !== undefined) result.requireString('displayName', { min: 2, max: 200 });
  if (body.firmType !== undefined) result.requireEnum('firmType', FIRM_TYPES);
  if (body.status !== undefined) result.requireEnum('status', STATUSES);
  if (body.assignedTo !== undefined) result.optionalObjectId('assignedTo');
  validateContactPersons(result);
  return result.build();
}

function validateContactPerson(body) {
  return new ValidationResult(body).requireString('name', { min: 2, max: 120 }).build();
}

const COMMUNICATION_TYPES = ['call', 'email', 'meeting', 'whatsapp', 'note'];

function validateCommunicationLog(body) {
  const result = new ValidationResult(body)
    .requireEnum('type', COMMUNICATION_TYPES)
    .requireString('summary', { min: 2, max: 500 });
  if (body.direction !== undefined && body.direction !== null) {
    result.requireEnum('direction', ['inbound', 'outbound']);
  }
  return result.build();
}

function validateSendMessage(body) {
  return new ValidationResult(body).requireString('body', { min: 1, max: 4000 }).build();
}

function validateBulkAssign(body) {
  const result = new ValidationResult(body);
  result.check(isArray(body.ids) && body.ids.length > 0 && body.ids.every(isObjectId), 'ids must be a non-empty array of valid ids');
  if (body.assignedTo !== undefined && body.assignedTo !== null) result.optionalObjectId('assignedTo');
  return result.build();
}

module.exports = {
  validateCreateClient, validateUpdateClient, validateContactPerson, validateCommunicationLog, validateSendMessage,
  validateBulkAssign, FIRM_TYPES, STATUSES, COMMUNICATION_TYPES,
};
