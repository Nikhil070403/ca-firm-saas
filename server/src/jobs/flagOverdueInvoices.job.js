const Invoice = require('../features/billing/models/Invoice.model');
const logger = require('../utils/logger');

/** Runs daily. Marks unpaid invoices whose due date has passed as overdue. */
async function run() {
  const result = await Invoice.updateMany(
    { isDeleted: false, status: { $in: ['sent', 'partially_paid'] }, dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } }
  );
  if (result.modifiedCount > 0) logger.info(`flagOverdueInvoices: flagged ${result.modifiedCount} invoice(s)`);
}

module.exports = { run };
