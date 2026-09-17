const expenseRepository = require('../repositories/expense.repository');
const AppError = require('../../../utils/AppError');
const { parseListQuery } = require('../../../utils/pagination');
const { notifyFirmAdmins } = require('../../../utils/notifyFirmAdmins');
const notificationService = require('../../reminders/services/notification.service');

async function listExpenses(firmId, query) {
  const { page, limit, skip, sort, filters, searchClause } = parseListQuery(query, {
    searchableFields: ['title', 'notes'],
    allowedFilters: ['category', 'clientId'],
  });
  const filter = { ...filters, ...(searchClause || {}) };
  const { items, total } = await expenseRepository.paginate(firmId, {
    filter,
    sort,
    skip,
    limit,
    populate: [{ path: 'clientId', select: 'displayName' }, { path: 'paidBy', select: 'name' }],
  });
  return { items, page, limit, total };
}

async function totalsByCategory(firmId) {
  return expenseRepository.totalByCategory(firmId);
}

async function createExpense(firmId, actorId, data) {
  const requiresApproval = data.requiresApproval === true || data.requiresApproval === 'true';
  const { requiresApproval: _omit, ...rest } = data;

  const expense = await expenseRepository.create(firmId, {
    ...rest,
    paidBy: actorId,
    createdBy: actorId,
    approvalStatus: requiresApproval ? 'pending' : 'not_required',
  });

  if (requiresApproval) {
    notifyFirmAdmins(firmId, actorId, {
      title: 'Expense awaiting your approval',
      message: `"${expense.title}" (₹${expense.amount}) was submitted for approval.`,
      link: '/accounts/expenses',
      sourceId: expense._id,
      sourceType: 'expense',
    }).catch(() => {});
  }

  return expense;
}

async function reviewExpense(firmId, actorId, id, { decision, reason }) {
  const expense = await expenseRepository.findById(firmId, id);
  if (!expense) throw AppError.notFound('Expense not found');
  if (expense.approvalStatus !== 'pending') {
    throw AppError.badRequest('This expense is not awaiting approval');
  }

  expense.approvalStatus = decision;
  expense.approvedBy = actorId;
  expense.approvedAt = new Date();
  expense.rejectionReason = decision === 'rejected' ? (reason || null) : null;
  expense.updatedBy = actorId;
  await expense.save();

  notificationService.notify({
    firmId,
    userId: expense.paidBy,
    type: 'system',
    title: decision === 'approved' ? 'Expense approved' : 'Expense rejected',
    message: decision === 'approved'
      ? `"${expense.title}" (₹${expense.amount}) was approved.`
      : `"${expense.title}" (₹${expense.amount}) was rejected${reason ? `: ${reason}` : '.'}`,
    link: '/accounts/expenses',
    sourceId: expense._id,
    sourceType: 'expense',
  }).catch(() => {});

  return expense;
}

async function getExpense(firmId, id) {
  const expense = await expenseRepository.findById(firmId, id);
  if (!expense) throw AppError.notFound('Expense not found');
  return expense;
}

async function updateExpense(firmId, id, actorId, updates) {
  const expense = await expenseRepository.updateById(firmId, id, updates, { updatedBy: actorId });
  if (!expense) throw AppError.notFound('Expense not found');
  return expense;
}

async function deleteExpense(firmId, id, actorId) {
  const expense = await expenseRepository.softDelete(firmId, id, { deletedBy: actorId });
  if (!expense) throw AppError.notFound('Expense not found');
  return expense;
}

module.exports = {
  listExpenses, totalsByCategory, createExpense, reviewExpense, getExpense, updateExpense, deleteExpense,
};
