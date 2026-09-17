const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const leadService = require('../services/lead.service');

const list = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await leadService.listLeads(req.user.firmId, req.query, req.user);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const pipeline = asyncHandler(async (req, res) => {
  const summary = await leadService.getPipelineSummary(req.user.firmId);
  return ApiResponse.success(res, { data: { summary } });
});

const sourceSummary = asyncHandler(async (req, res) => {
  const summary = await leadService.getSourceSummary(req.user.firmId);
  return ApiResponse.success(res, { data: { summary } });
});

const ownerSummary = asyncHandler(async (req, res) => {
  const summary = await leadService.getOwnerSummary(req.user.firmId);
  return ApiResponse.success(res, { data: { summary } });
});

const upcomingFollowUps = asyncHandler(async (req, res) => {
  const followUps = await leadService.listUpcomingFollowUps(req.user.firmId);
  return ApiResponse.success(res, { data: { followUps } });
});

const completeFollowUp = asyncHandler(async (req, res) => {
  const activity = await leadService.completeFollowUp(req.user.firmId, req.params.activityId);
  return ApiResponse.success(res, { message: 'Follow-up marked complete', data: { activity } });
});

const create = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.user.firmId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Lead created', data: { lead } });
});

const getOne = asyncHandler(async (req, res) => {
  const lead = await leadService.getLead(req.user.firmId, req.params.id, req.user);
  return ApiResponse.success(res, { data: { lead } });
});

const update = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(req.user.firmId, req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, { message: 'Lead updated', data: { lead } });
});

const remove = asyncHandler(async (req, res) => {
  await leadService.deleteLead(req.user.firmId, req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Lead deleted' });
});

const addActivity = asyncHandler(async (req, res) => {
  const activity = await leadService.addActivity(req.user.firmId, req.params.id, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Activity logged', data: { activity } });
});

const listActivities = asyncHandler(async (req, res) => {
  const activities = await leadService.listActivities(req.user.firmId, req.params.id);
  return ApiResponse.success(res, { data: { activities } });
});

const convert = asyncHandler(async (req, res) => {
  const client = await leadService.convertToClient(req.user.firmId, req.params.id, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Lead converted to client', data: { client } });
});

const bulkAssign = asyncHandler(async (req, res) => {
  const result = await leadService.bulkAssign(req.user.firmId, req.body.ids, req.body.assignedTo);
  return ApiResponse.success(res, { message: `${result.modifiedCount} lead(s) reassigned`, data: result });
});

module.exports = {
  list, pipeline, sourceSummary, ownerSummary, upcomingFollowUps, completeFollowUp,
  create, getOne, update, remove, addActivity, listActivities, convert, bulkAssign,
};
