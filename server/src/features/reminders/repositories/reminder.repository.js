const BaseRepository = require('../../../repositories/BaseRepository');
const Reminder = require('../models/Reminder.model');

class ReminderRepository extends BaseRepository {
  constructor() {
    super(Reminder);
  }

  listDueBetween(firmId, from, to) {
    return this.model.find(
      this.scoped(firmId, { dueDate: { $gte: from, $lte: to }, status: { $in: ['pending', 'overdue'] } })
    ).populate('assignedTo', 'name email').populate('clientId', 'displayName');
  }

  listOverdue(firmId, asOf = new Date()) {
    return this.model.find(this.scoped(firmId, { dueDate: { $lt: asOf }, status: 'pending' }));
  }

  listActiveRecurringTemplates() {
    // Cross-firm scan used only by the cron job — intentionally not
    // firm-scoped via `scoped()` since it needs to run for every firm.
    return this.model.find({
      isDeleted: false,
      recurrence: { $ne: 'none' },
      recurrenceParentId: null,
    });
  }
}

module.exports = new ReminderRepository();
