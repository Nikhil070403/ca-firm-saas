const { ValidationResult } = require('../../../utils/validationHelpers');

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];
const STAGES = [
  'document_collection', 'verification', 'preparation',
  'review', 'partner_approval', 'filed', 'completed',
];

function validateCreateTask(body) {
  const result = new ValidationResult(body).requireString('title', { min: 2, max: 200 });
  if (body.priority !== undefined) result.requireEnum('priority', PRIORITIES);
  if (body.stage !== undefined) result.requireEnum('stage', STAGES);
  if (body.clientId !== undefined) result.optionalObjectId('clientId');
  if (body.assignedTo !== undefined) result.optionalObjectId('assignedTo');
  return result.build();
}

function validateUpdateTask(body) {
  const result = new ValidationResult(body);
  if (body.title !== undefined) result.requireString('title', { min: 2, max: 200 });
  if (body.priority !== undefined) result.requireEnum('priority', PRIORITIES);
  if (body.status !== undefined) result.requireEnum('status', STATUSES);
  if (body.stage !== undefined) result.requireEnum('stage', STAGES);
  if (body.assignedTo !== undefined) result.optionalObjectId('assignedTo');
  return result.build();
}

function validateChecklistItem(body) {
  return new ValidationResult(body).requireString('label', { min: 1, max: 300 }).build();
}

function validateComment(body) {
  return new ValidationResult(body).requireString('message', { min: 1, max: 2000 }).build();
}

function validateTimeLog(body) {
  return new ValidationResult(body).requireNumber('minutes', { min: 1, max: 1440 }).build();
}

module.exports = { validateCreateTask, validateUpdateTask, validateChecklistItem, validateComment, validateTimeLog, STATUSES, PRIORITIES, STAGES };
