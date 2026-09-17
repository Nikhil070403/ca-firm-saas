const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const documentService = require('../services/document.service');

const list = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await documentService.listDocuments(req.user.firmId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const upload = asyncHandler(async (req, res) => {
  const document = await documentService.uploadDocument(req.user.firmId, req.user.id, req.file, req.body);
  return ApiResponse.created(res, { message: 'Document uploaded', data: { document } });
});

const uploadNewVersion = asyncHandler(async (req, res) => {
  const document = await documentService.uploadNewVersion(req.user.firmId, req.user.id, req.params.id, req.file);
  return ApiResponse.created(res, { message: 'New version uploaded', data: { document } });
});

const review = asyncHandler(async (req, res) => {
  const document = await documentService.reviewDocument(req.user.firmId, req.user.id, req.params.id, req.body);
  return ApiResponse.success(res, { message: `Document ${req.body.decision}`, data: { document } });
});

const remove = asyncHandler(async (req, res) => {
  await documentService.deleteDocument(req.user.firmId, req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Document deleted' });
});

const createFolder = asyncHandler(async (req, res) => {
  const folder = await documentService.createFolder(req.user.firmId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Folder created', data: { folder } });
});

const listFolders = asyncHandler(async (req, res) => {
  const folders = await documentService.listFolders(req.user.firmId, req.query.parentFolderId);
  return ApiResponse.success(res, { data: { folders } });
});

module.exports = { list, upload, uploadNewVersion, review, remove, createFolder, listFolders };
