const { ValidationResult } = require('../../../utils/validationHelpers');
const Reminder = require('../models/Reminder.model');

function validateCreateReminder(body) {
  const result = new ValidationResult(body)
    .requireString('title', { min: 2, max: 200 })
    .check(body.dueDate && !Number.isNaN(Date.parse(body.dueDate)), 'dueDate must be a valid date');

  if (body.category !== undefined) result.requireEnum('category', Reminder.CATEGORIES);
  if (body.recurrence !== undefined) result.requireEnum('recurrence', Reminder.RECURRENCE_TYPES);
  if (body.clientId !== undefined) result.optionalObjectId('clientId');
  if (body.assignedTo !== undefined) result.optionalObjectId('assignedTo');
  return result.build();
}

function validateUpdateReminder(body) {
  const result = new ValidationResult(body);
  if (body.title !== undefined) result.requireString('title', { min: 2, max: 200 });
  if (body.dueDate !== undefined) result.check(!Number.isNaN(Date.parse(body.dueDate)), 'dueDate must be a valid date');
  if (body.category !== undefined) result.requireEnum('category', Reminder.CATEGORIES);
  if (body.status !== undefined) result.requireEnum('status', ['pending', 'sent', 'completed', 'dismissed', 'overdue']);
  return result.build();
}

module.exports = { validateCreateReminder, validateUpdateReminder };
