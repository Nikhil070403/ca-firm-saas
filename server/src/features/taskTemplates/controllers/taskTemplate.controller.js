const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const taskTemplateService = require('../services/taskTemplate.service');

const list = asyncHandler(async (req, res) => {
  const templates = await taskTemplateService.listTemplates(req.user.firmId);
  return ApiResponse.success(res, { data: { templates } });
});

const create = asyncHandler(async (req, res) => {
  const template = await taskTemplateService.createTemplate(req.user.firmId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Template created', data: { template } });
});

const update = asyncHandler(async (req, res) => {
  const template = await taskTemplateService.updateTemplate(req.user.firmId, req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, { message: 'Template updated', data: { template } });
});

const remove = asyncHandler(async (req, res) => {
  await taskTemplateService.deleteTemplate(req.user.firmId, req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Template deleted' });
});

const apply = asyncHandler(async (req, res) => {
  const task = await taskTemplateService.applyTemplate(req.user.firmId, req.user.id, req.params.id, req.body);
  return ApiResponse.created(res, { message: 'Task created from template', data: { task } });
});

module.exports = { list, create, update, remove, apply };
