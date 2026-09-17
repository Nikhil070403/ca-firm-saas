const cron = require('node-cron');
const logger = require('../utils/logger');
const generateRecurringReminders = require('./generateRecurringReminders.job');
const reminderDigest = require('./reminderDigest.job');
const flagOverdueInvoices = require('./flagOverdueInvoices.job');
const cleanupRefreshTokens = require('./cleanupRefreshTokens.job');
const complianceGenerate = require('./complianceGenerate.job');
const complianceReminders = require('./complianceReminders.job');
const invoiceFollowUps = require('./invoiceFollowUps.job');

function runSafely(name, job) {
  return async () => {
    try {
      await job.run();
    } catch (err) {
      logger.error(`Cron job "${name}" failed:`, err.message);
    }
  };
}

function registerJobs() {
  // Every day at 06:00 server time: roll recurring reminder templates forward.
  cron.schedule('0 6 * * *', runSafely('generateRecurringReminders', generateRecurringReminders));
  // Every day at 07:00: notify assignees of reminders due today, flag overdue.
  cron.schedule('0 7 * * *', runSafely('reminderDigest', reminderDigest));
  // Every day at 01:00: flag invoices past their due date.
  cron.schedule('0 1 * * *', runSafely('flagOverdueInvoices', flagOverdueInvoices));
  // Every Sunday at 02:00: purge long-revoked refresh tokens.
  cron.schedule('0 2 * * 0', runSafely('cleanupRefreshTokens', cleanupRefreshTokens));
  // Every day at 05:30: create the current period's compliance returns.
  cron.schedule('30 5 * * *', runSafely('complianceGenerate', complianceGenerate));
  // Every day at 08:00: remind clients of pending returns inside their window.
  cron.schedule('0 8 * * *', runSafely('complianceReminders', complianceReminders));
  // Every day at 09:30: one-time payment follow-up 10 days after invoicing.
  cron.schedule('30 9 * * *', runSafely('invoiceFollowUps', invoiceFollowUps));

  logger.info('Cron jobs registered');
}

module.exports = { registerJobs };
