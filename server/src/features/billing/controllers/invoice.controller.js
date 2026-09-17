const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const invoiceService = require('../services/invoice.service');

const list = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await invoiceService.listInvoices(req.user.firmId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const create = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.user.firmId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Invoice created', data: { invoice } });
});

const getOne = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoice(req.user.firmId, req.params.id);
  return ApiResponse.success(res, { data: { invoice } });
});

const updateStatus = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.updateStatus(req.user.firmId, req.params.id, req.user.id, req.body.status);
  return ApiResponse.success(res, { message: 'Invoice status updated', data: { invoice } });
});

const remove = asyncHandler(async (req, res) => {
  await invoiceService.deleteInvoice(req.user.firmId, req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Invoice deleted' });
});

module.exports = { list, create, getOne, updateStatus, remove };
