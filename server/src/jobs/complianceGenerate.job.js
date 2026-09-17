const complianceService = require('../features/compliance/services/compliance.service');
const logger = require('../utils/logger');

/**
 * Daily: make sure every configured client has ComplianceReturn rows for the
 * current filable period (GSTR-1/3B monthly or quarterly, plus yearly
 * ITR/9C/ROC/Audit). Idempotent — re-running never duplicates.
 */
module.exports = {
  async run() {
    const { created, clientsScanned } = await complianceService.generateReturns();
    if (created > 0) {
      logger.info(`Compliance generator: ${created} new return(s) across ${clientsScanned} client(s)`);
    }
  },
};
