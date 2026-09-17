const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const taskService = require('../services/task.service');

const list = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await taskService.listTasks(req.user.firmId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const statusCounts = asyncHandler(async (req, res) => {
  const counts = await taskService.getStatusCounts(req.user.firmId);
  return ApiResponse.success(res, { data: { counts } });
});

const create = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.firmId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Task created', data: { task } });
});

const getOne = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.user.firmId, req.params.id);
  return ApiResponse.success(res, { data: { task } });
});

const update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user.firmId, req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, { message: 'Task updated', data: { task } });
});

const remove = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.user.firmId, req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Task deleted' });
});

const addChecklistItem = asyncHandler(async (req, res) => {
  const task = await taskService.addChecklistItem(req.user.firmId, req.params.id, req.body.label);
  return ApiResponse.created(res, { data: { task } });
});

const toggleChecklistItem = asyncHandler(async (req, res) => {
  const task = await taskService.toggleChecklistItem(req.user.firmId, req.params.id, req.params.itemId, req.body.isDone);
  return ApiResponse.success(res, { data: { task } });
});

const removeChecklistItem = asyncHandler(async (req, res) => {
  const task = await taskService.removeChecklistItem(req.user.firmId, req.params.id, req.params.itemId);
  return ApiResponse.success(res, { data: { task } });
});

const addComment = asyncHandler(async (req, res) => {
  const task = await taskService.addComment(req.user.firmId, req.params.id, req.user.id, req.body.message);
  return ApiResponse.created(res, { data: { task } });
});

const logTime = asyncHandler(async (req, res) => {
  const task = await taskService.logTime(req.user.firmId, req.params.id, req.user.id, req.body.minutes, req.body.note);
  return ApiResponse.created(res, { data: { task } });
});

module.exports = {
  list, statusCounts, create, getOne, update, remove,
  addChecklistItem, toggleChecklistItem, removeChecklistItem, addComment, logTime,
};
