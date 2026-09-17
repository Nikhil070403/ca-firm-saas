const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const receiptService = require('../services/receipt.service');

const list = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await receiptService.listReceipts(req.user.firmId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const create = asyncHandler(async (req, res) => {
  const receipt = await receiptService.createReceipt(req.user.firmId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Receipt recorded', data: { receipt } });
});

const getOne = asyncHandler(async (req, res) => {
  const receipt = await receiptService.getReceipt(req.user.firmId, req.params.id);
  return ApiResponse.success(res, { data: { receipt } });
});

module.exports = { list, create, getOne };
