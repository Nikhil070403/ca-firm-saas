const { ValidationResult, isArray, isObjectId } = require('../../../utils/validationHelpers');
const Lead = require('../models/Lead.model');

const SOURCES = ['referral', 'website', 'social_media', 'walk_in', 'cold_call', 'advertisement', 'other'];
const ACTIVITY_TYPES = ['note', 'call', 'meeting', 'email', 'follow_up'];

function validateCreateLead(body) {
  const result = new ValidationResult(body).requireString('name', { min: 2, max: 120 });
  if (body.email) result.requireEmail('email');
  if (body.source !== undefined) result.requireEnum('source', SOURCES);
  if (body.estimatedValue !== undefined) result.requireNumber('estimatedValue', { min: 0 });
  if (body.assignedTo !== undefined) result.optionalObjectId('assignedTo');
  return result.build();
}

function validateUpdateLead(body) {
  const result = new ValidationResult(body);
  if (body.name !== undefined) result.requireString('name', { min: 2, max: 120 });
  if (body.status !== undefined) result.requireEnum('status', Lead.STATUSES);
  if (body.source !== undefined) result.requireEnum('source', SOURCES);
  if (body.estimatedValue !== undefined) result.requireNumber('estimatedValue', { min: 0 });
  if (body.assignedTo !== undefined) result.optionalObjectId('assignedTo');
  return result.build();
}

function validateLeadActivity(body) {
  return new ValidationResult(body)
    .requireEnum('type', ACTIVITY_TYPES)
    .requireString('summary', { min: 2, max: 300 })
    .build();
}

function validateBulkAssign(body) {
  const result = new ValidationResult(body);
  result.check(isArray(body.ids) && body.ids.length > 0 && body.ids.every(isObjectId), 'ids must be a non-empty array of valid ids');
  if (body.assignedTo !== undefined && body.assignedTo !== null) result.optionalObjectId('assignedTo');
  return result.build();
}

module.exports = { validateCreateLead, validateUpdateLead, validateLeadActivity, validateBulkAssign };
