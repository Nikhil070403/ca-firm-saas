const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const reminderService = require('../services/reminder.service');

const list = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await reminderService.listReminders(req.user.firmId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const calendar = asyncHandler(async (req, res) => {
  const reminders = await reminderService.listCalendar(req.user.firmId, req.query);
  return ApiResponse.success(res, { data: { reminders } });
});

const create = asyncHandler(async (req, res) => {
  const reminder = await reminderService.createReminder(req.user.firmId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Reminder created', data: { reminder } });
});

const getOne = asyncHandler(async (req, res) => {
  const reminder = await reminderService.getReminder(req.user.firmId, req.params.id);
  return ApiResponse.success(res, { data: { reminder } });
});

const update = asyncHandler(async (req, res) => {
  const reminder = await reminderService.updateReminder(req.user.firmId, req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, { message: 'Reminder updated', data: { reminder } });
});

const complete = asyncHandler(async (req, res) => {
  const reminder = await reminderService.completeReminder(req.user.firmId, req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Reminder marked complete', data: { reminder } });
});

const remove = asyncHandler(async (req, res) => {
  await reminderService.deleteReminder(req.user.firmId, req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Reminder deleted' });
});

module.exports = { list, calendar, create, getOne, update, complete, remove };
