const mongoose = require('mongoose');
const Invoice = require('../../billing/models/Invoice.model');
const Expense = require('../../billing/models/Expense.model');
const Client = require('../../clients/models/Client.model');
const Task = require('../../tasks/models/Task.model');
const Reminder = require('../../reminders/models/Reminder.model');
const invoiceRepository = require('../../billing/repositories/invoice.repository');
const ledgerService = require('../../khatabook/services/ledger.service');

/**
 * Reports are read-only aggregations spanning multiple modules — deliberately
 * querying models directly here rather than forcing every module's
 * repository to grow report-specific methods it otherwise wouldn't need.
 */
function toObjectId(id) {
  return new mongoose.Types.ObjectId(id);
}

async function revenueReport(firmId, { monthsBack = 6 } = {}) {
  const monthly = await invoiceRepository.revenueByMonth(firmId, monthsBack);
  const [outstanding] = await invoiceRepository.outstandingTotal(firmId);
  return { monthly, outstandingTotal: outstanding?.total || 0 };
}

async function outstandingReport(firmId) {
  return Invoice.find({ firmId, isDeleted: false, status: { $nin: ['paid', 'cancelled', 'draft'] } })
    .populate('clientId', 'displayName email phone')
    .sort({ dueDate: 1 })
    .lean();
}

async function clientWiseReport(firmId) {
  return Invoice.aggregate([
    { $match: { firmId: toObjectId(firmId), isDeleted: false } },
    {
      $group: {
        _id: '$clientId',
        totalBilled: { $sum: '$grandTotal' },
        totalPaid: { $sum: '$amountPaid' },
        invoiceCount: { $sum: 1 },
      },
    },
    { $addFields: { outstanding: { $subtract: ['$totalBilled', '$totalPaid'] } } },
    { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
    { $unwind: '$client' },
    { $project: { client: { displayName: 1, email: 1, gstNumber: 1 }, totalBilled: 1, totalPaid: 1, outstanding: 1, invoiceCount: 1 } },
    { $sort: { outstanding: -1 } },
  ]);
}

async function employeeWiseReport(firmId) {
  return Task.aggregate([
    { $match: { firmId: toObjectId(firmId), isDeleted: false, assignedTo: { $ne: null } } },
    {
      $group: {
        _id: '$assignedTo',
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        minutesLogged: { $sum: { $sum: '$timeLogs.minutes' } },
      },
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { user: { name: 1, email: 1 }, totalTasks: 1, completedTasks: 1, minutesLogged: 1 } },
    { $sort: { completedTasks: -1 } },
  ]);
}

async function reminderWiseReport(firmId) {
  return Reminder.aggregate([
    { $match: { firmId: toObjectId(firmId), isDeleted: false } },
    { $group: { _id: { category: '$category', status: '$status' }, count: { $sum: 1 } } },
    { $sort: { '_id.category': 1 } },
  ]);
}

async function gstReport(firmId, { from, to } = {}) {
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);

  const match = { firmId: toObjectId(firmId), isDeleted: false, status: { $ne: 'cancelled' } };
  if (from || to) match.issueDate = dateFilter;

  return Invoice.aggregate([
    { $match: match },
    { $lookup: { from: 'clients', localField: 'clientId', foreignField: '_id', as: 'client' } },
    { $unwind: '$client' },
    { $match: { 'client.gstNumber': { $ne: null } } },
    {
      $project: {
        invoiceNumber: 1,
        issueDate: 1,
        grandTotal: 1,
        taxTotal: 1,
        subtotal: 1,
        client: { displayName: 1, gstNumber: 1 },
      },
    },
    { $sort: { issueDate: 1 } },
  ]);
}

async function ledgerReport(firmId, clientId, { from, to } = {}) {
  return ledgerService.getStatement(firmId, clientId, { from, to });
}

async function expenseSummary(firmId) {
  return Expense.aggregate([
    { $match: { firmId: toObjectId(firmId), isDeleted: false } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);
}

async function clientCount(firmId) {
  return Client.countDocuments({ firmId, isDeleted: false, status: 'active' });
}

module.exports = {
  revenueReport,
  outstandingReport,
  clientWiseReport,
  employeeWiseReport,
  reminderWiseReport,
  gstReport,
  ledgerReport,
  expenseSummary,
  clientCount,
};
