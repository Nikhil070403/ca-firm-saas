const reminderRepository = require('../repositories/reminder.repository');
const notificationService = require('./notification.service');
const AppError = require('../../../utils/AppError');
const { parseListQuery } = require('../../../utils/pagination');

async function listReminders(firmId, query) {
  const { page, limit, skip, sort, filters, searchClause } = parseListQuery(query, {
    searchableFields: ['title', 'description'],
    allowedFilters: ['status', 'category', 'clientId', 'assignedTo'],
  });
  const filter = { ...filters, ...(searchClause || {}) };
  const { items, total } = await reminderRepository.paginate(firmId, {
    filter,
    sort,
    skip,
    limit,
    populate: [{ path: 'assignedTo', select: 'name email' }, { path: 'clientId', select: 'displayName' }],
  });
  return { items, page, limit, total };
}

async function listCalendar(firmId, { from, to }) {
  if (!from || !to) throw AppError.badRequest('from and to query params are required');
  return reminderRepository.listDueBetween(firmId, new Date(from), new Date(to));
}

async function createReminder(firmId, actorId, data) {
  const reminder = await reminderRepository.create(firmId, { ...data, createdBy: actorId });

  if (reminder.assignedTo) {
    await notifyAssignee(firmId, reminder);
  }
  return reminder;
}

async function notifyAssignee(firmId, reminder) {
  await notificationService.notify({
    firmId,
    userId: reminder.assignedTo,
    type: 'reminder_due',
    title: `Reminder: ${reminder.title}`,
    message: `Due on ${new Date(reminder.dueDate).toLocaleDateString()}`,
    link: `/reminders/${reminder._id}`,
    sourceId: reminder._id,
    sourceType: 'reminder',
  });
}

async function getReminder(firmId, id) {
  const reminder = await reminderRepository.findById(firmId, id, {
    populate: [{ path: 'assignedTo', select: 'name email' }, { path: 'clientId', select: 'displayName' }],
  });
  if (!reminder) throw AppError.notFound('Reminder not found');
  return reminder;
}

async function updateReminder(firmId, id, actorId, updates) {
  const reminder = await reminderRepository.updateById(firmId, id, updates, { updatedBy: actorId });
  if (!reminder) throw AppError.notFound('Reminder not found');
  return reminder;
}

async function completeReminder(firmId, id, actorId) {
  return updateReminder(firmId, id, actorId, { status: 'completed', completedAt: new Date() });
}

async function deleteReminder(firmId, id, actorId) {
  const reminder = await reminderRepository.softDelete(firmId, id, { deletedBy: actorId });
  if (!reminder) throw AppError.notFound('Reminder not found');
  return reminder;
}

// Called by jobs/generateRecurringReminders.job.js — creates the next
// occurrence document from a recurring template's most recent occurrence.
function nextDueDate(currentDue, recurrence) {
  const next = new Date(currentDue);
  switch (recurrence) {
    case 'daily': next.setDate(next.getDate() + 1); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
    case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
    default: break;
  }
  return next;
}

module.exports = {
  listReminders,
  listCalendar,
  createReminder,
  getReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
  notifyAssignee,
  nextDueDate,
};
