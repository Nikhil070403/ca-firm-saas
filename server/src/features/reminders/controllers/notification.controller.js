const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const notificationService = require('../services/notification.service');

const list = asyncHandler(async (req, res) => {
  const { items, page, limit, total, unreadCount } = await notificationService.listMine(
    req.user.firmId,
    req.user.id,
    req.query
  );
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return ApiResponse.success(res, {
    data: items,
    meta: { page, limit, total, totalPages, unreadCount },
  });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user.firmId, req.user.id, req.params.id);
  return ApiResponse.success(res, { data: { notification } });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.firmId, req.user.id);
  return ApiResponse.success(res, { message: 'All notifications marked read' });
});

module.exports = { list, markRead, markAllRead };
