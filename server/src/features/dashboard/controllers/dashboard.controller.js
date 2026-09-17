const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const dashboardService = require('../services/dashboard.service');

const overview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOverview(req.user.firmId);
  return ApiResponse.success(res, { data });
});

module.exports = { overview };
