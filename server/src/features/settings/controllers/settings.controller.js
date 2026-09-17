const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const settingsService = require('../services/settings.service');

const getFirm = asyncHandler(async (req, res) => {
  const firm = await settingsService.getFirmProfile(req.user.firmId);
  return ApiResponse.success(res, { data: { firm } });
});

const updateFirm = asyncHandler(async (req, res) => {
  const firm = await settingsService.updateFirmProfile(req.user.firmId, req.body);
  return ApiResponse.success(res, { message: 'Firm settings updated', data: { firm } });
});

const getFirmBranding = asyncHandler(async (req, res) => {
  const branding = await settingsService.getFirmBranding(req.user.firmId);
  return ApiResponse.success(res, { data: { branding } });
});

const listEmailTemplates = asyncHandler(async (req, res) => {
  const templates = await settingsService.listEmailTemplates(req.user.firmId);
  return ApiResponse.success(res, { data: { templates } });
});

const upsertEmailTemplate = asyncHandler(async (req, res) => {
  const template = await settingsService.upsertEmailTemplate(req.user.firmId, req.params.key, req.body);
  return ApiResponse.success(res, { message: 'Email template saved', data: { template } });
});

const backup = asyncHandler(async (req, res) => {
  const data = await settingsService.exportBackup(req.user.firmId);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="backup-${Date.now()}.json"`);
  return res.send(JSON.stringify(data, null, 2));
});

module.exports = { getFirm, updateFirm, getFirmBranding, listEmailTemplates, upsertEmailTemplate, backup };
