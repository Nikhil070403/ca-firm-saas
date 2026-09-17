const BaseRepository = require('../../../repositories/BaseRepository');
const ComplianceReturn = require('../models/ComplianceReturn.model');

class ComplianceReturnRepository extends BaseRepository {
  constructor() {
    super(ComplianceReturn);
  }

  /** Idempotent create: the generator cron runs daily and must not duplicate. */
  upsertPeriod(firmId, clientId, returnType, data) {
    return this.model.findOneAndUpdate(
      { firmId, clientId, returnType, periodKey: data.periodKey, isDeleted: false },
      { $setOnInsert: { ...data, firmId, clientId, returnType } },
      { upsert: true, new: true }
    );
  }

  /** Pending returns whose reminder window is open (cross-firm, for the cron). */
  findDueForReminder(now = new Date()) {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return this.model.find({
      isDeleted: false,
      status: 'pending',
      remindFrom: { $lte: now },
      $or: [{ lastReminderAt: null }, { lastReminderAt: { $lt: startOfToday } }],
    }).populate('clientId', 'displayName email phone');
  }
}

module.exports = new ComplianceReturnRepository();
