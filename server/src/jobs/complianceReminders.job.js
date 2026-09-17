const complianceService = require('../features/compliance/services/compliance.service');

/**
 * Daily: email/SMS-log every client whose return is pending and inside its
 * reminder window (GSTR-1 from the 4th, GSTR-3B from the 14th, yearly from
 * 30 days out) — repeating each day until the return is marked filed.
 */
module.exports = {
  async run() {
    await complianceService.sendReminders();
  },
};
