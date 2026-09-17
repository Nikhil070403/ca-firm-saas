const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const activityLogService = require('../services/activityLog.service');

const list = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const activities = await activityLogService.listRecentForFirm(req.user.firmId, { limit });
  return ApiResponse.success(res, { data: { activities } });
});

module.exports = { list };
