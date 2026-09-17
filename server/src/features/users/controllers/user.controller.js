const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const userService = require('../services/user.service');

const list = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await userService.listUsers(req.user.firmId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.user.firmId, req.user, req.body);
  return ApiResponse.created(res, { message: 'User invited', data: { user } });
});

const getOne = asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.user.firmId, req.params.id);
  return ApiResponse.success(res, { data: { user } });
});

const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.user.firmId, req.params.id, req.user, req.body);
  return ApiResponse.success(res, { message: 'User updated', data: { user } });
});

const setActive = asyncHandler(async (req, res) => {
  const user = await userService.setActiveStatus(req.user.firmId, req.params.id, req.user, req.body.isActive);
  return ApiResponse.success(res, { message: 'User status updated', data: { user } });
});

const remove = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.user.firmId, req.params.id, req.user);
  return ApiResponse.success(res, { message: 'User removed' });
});

module.exports = { list, create, getOne, update, setActive, remove };
