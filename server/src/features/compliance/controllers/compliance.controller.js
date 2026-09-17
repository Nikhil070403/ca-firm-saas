const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const AppError = require('../../../utils/AppError');
const complianceService = require('../services/compliance.service');

const list = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await complianceService.listReturns(req.user.firmId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

// Manual trigger of the same routine the daily cron runs — lets staff pull
// the new period in immediately after configuring a client.
const generate = asyncHandler(async (req, res) => {
  const result = await complianceService.generateReturns();
  return ApiResponse.success(res, {
    message: `Generated ${result.created} new return(s) across ${result.clientsScanned} client(s)`,
    data: result,
  });
});

const markFiled = asyncHandler(async (req, res) => {
  const ret = await complianceService.markFiled(req.user.firmId, req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Marked filed — client notified', data: { return: ret } });
});

const setTaxPayable = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw AppError.validation('amount must be a non-negative number');
  }
  const ret = await complianceService.setTaxPayable(req.user.firmId, req.params.id, amount);
  return ApiResponse.success(res, { message: 'Tax payable saved — client notified', data: { return: ret } });
});

module.exports = { list, generate, markFiled, setTaxPayable };
