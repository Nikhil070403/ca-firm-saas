const Firm = require('../features/settings/models/Firm.model');

const DEFAULTS = {
  gstReminders: true,
  yearlyReminders: true,
  invoiceFollowUps: true,
  taskAssignmentNotify: true,
  documentUploadNotify: true,
};

/**
 * Single check point every automation-driven code path (cron jobs, a couple
 * of service-layer call sites) calls before acting, so the Settings >
 * Automation Rules toggles have real effect instead of being decorative.
 */
async function isAutomationEnabled(firmId, key) {
  const firm = await Firm.findById(firmId).select('automationRules').lean();
  const value = firm?.automationRules?.[key];
  return value !== undefined ? value : DEFAULTS[key];
}

module.exports = { isAutomationEnabled, DEFAULTS };
