const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const departmentService = require('../services/department.service');

const list = asyncHandler(async (req, res) => {
  const departments = await departmentService.listDepartments(req.user.firmId);
  return ApiResponse.success(res, { data: { departments } });
});

const create = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment(req.user.firmId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Department created', data: { department } });
});

const update = asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment(req.user.firmId, req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, { message: 'Department updated', data: { department } });
});

const remove = asyncHandler(async (req, res) => {
  await departmentService.deleteDepartment(req.user.firmId, req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Department deleted' });
});

module.exports = { list, create, update, remove };
