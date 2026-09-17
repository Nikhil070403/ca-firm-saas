const reminderRepository = require('../features/reminders/repositories/reminder.repository');
const reminderService = require('../features/reminders/services/reminder.service');
const logger = require('../utils/logger');

/**
 * Runs daily. For every recurring reminder template whose most recent
 * occurrence's due date has passed, creates the next occurrence.
 */
async function run() {
  const templates = await reminderRepository.listActiveRecurringTemplates();
  const now = new Date();
  let created = 0;

  for (const template of templates) {
    if (template.dueDate > now) continue;

    const nextDue = reminderService.nextDueDate(template.dueDate, template.recurrence);
    await reminderRepository.create(template.firmId, {
      title: template.title,
      category: template.category,
      description: template.description,
      clientId: template.clientId,
      assignedTo: template.assignedTo,
      dueDate: nextDue,
      recurrence: 'none',
      recurrenceParentId: template._id,
      channels: template.channels,
    });

    await reminderRepository.updateById(template.firmId, template._id, { dueDate: nextDue });
    created += 1;
  }

  if (created > 0) logger.info(`generateRecurringReminders: created ${created} occurrence(s)`);
}

module.exports = { run };
