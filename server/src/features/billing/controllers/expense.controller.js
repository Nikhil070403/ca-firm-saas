const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const expenseService = require('../services/expense.service');

const list = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await expenseService.listExpenses(req.user.firmId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const totalsByCategory = asyncHandler(async (req, res) => {
  const totals = await expenseService.totalsByCategory(req.user.firmId);
  return ApiResponse.success(res, { data: { totals } });
});

const create = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.user.firmId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Expense recorded', data: { expense } });
});

const getOne = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpense(req.user.firmId, req.params.id);
  return ApiResponse.success(res, { data: { expense } });
});

const update = asyncHandler(async (req, res) => {
  const expense = await expenseService.updateExpense(req.user.firmId, req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, { message: 'Expense updated', data: { expense } });
});

const remove = asyncHandler(async (req, res) => {
  await expenseService.deleteExpense(req.user.firmId, req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Expense deleted' });
});

const review = asyncHandler(async (req, res) => {
  const expense = await expenseService.reviewExpense(req.user.firmId, req.user.id, req.params.id, req.body);
  return ApiResponse.success(res, { message: `Expense ${req.body.decision}`, data: { expense } });
});

module.exports = { list, totalsByCategory, create, getOne, update, remove, review };
