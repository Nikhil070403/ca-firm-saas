const Reminder = require('../features/reminders/models/Reminder.model');
const reminderService = require('../features/reminders/services/reminder.service');
const logger = require('../utils/logger');

/**
 * Runs daily. Sends (email + in-app) notifications for reminders due today
 * that haven't been notified yet, then flags anything past due as overdue.
 */
async function run() {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const dueToday = await Reminder.find({
    isDeleted: false,
    status: 'pending',
    dueDate: { $lt: endOfToday },
    assignedTo: { $ne: null },
  });

  let notified = 0;
  for (const reminder of dueToday) {
    if (!reminder.channels?.email) continue;
    await reminderService.notifyAssignee(reminder.firmId, reminder);
    reminder.status = 'sent';
    await reminder.save();
    notified += 1;
  }

  const overdueResult = await Reminder.updateMany(
    { isDeleted: false, status: { $in: ['pending', 'sent'] }, dueDate: { $lt: now } },
    { $set: { status: 'overdue' } }
  );

  logger.info(`reminderDigest: notified ${notified}, flagged ${overdueResult.modifiedCount} overdue`);
}

module.exports = { run };
