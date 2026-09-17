const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const portalService = require('../services/portal.service');

const overview = asyncHandler(async (req, res) => {
  const clientId = portalService.requireLinkedClient(req.user);
  const data = await portalService.getOverview(req.user.firmId, clientId);
  return ApiResponse.success(res, { data });
});

const compliance = asyncHandler(async (req, res) => {
  const clientId = portalService.requireLinkedClient(req.user);
  const { items, page, limit, total } = await portalService.listCompliance(req.user.firmId, clientId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const invoices = asyncHandler(async (req, res) => {
  const clientId = portalService.requireLinkedClient(req.user);
  const { items, page, limit, total } = await portalService.listInvoices(req.user.firmId, clientId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const documents = asyncHandler(async (req, res) => {
  const clientId = portalService.requireLinkedClient(req.user);
  const { items, page, limit, total } = await portalService.listDocuments(req.user.firmId, clientId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const ledger = asyncHandler(async (req, res) => {
  const clientId = portalService.requireLinkedClient(req.user);
  const { from, to } = req.query;
  const data = await portalService.getLedger(req.user.firmId, clientId, { from, to });
  return ApiResponse.success(res, { data });
});

const tasks = asyncHandler(async (req, res) => {
  const clientId = portalService.requireLinkedClient(req.user);
  const { items, page, limit, total } = await portalService.listTasks(req.user.firmId, clientId, req.query);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const messages = asyncHandler(async (req, res) => {
  const clientId = portalService.requireLinkedClient(req.user);
  const messageList = await portalService.listMessages(req.user.firmId, clientId);
  return ApiResponse.success(res, { data: { messages: messageList } });
});

const sendMessage = asyncHandler(async (req, res) => {
  const clientId = portalService.requireLinkedClient(req.user);
  const message = await portalService.sendMessage(req.user.firmId, clientId, req.user.id, req.body.body);
  return ApiResponse.created(res, { message: 'Message sent', data: { message } });
});

const markMessagesRead = asyncHandler(async (req, res) => {
  const clientId = portalService.requireLinkedClient(req.user);
  await portalService.markMessagesRead(req.user.firmId, clientId);
  return ApiResponse.success(res, { message: 'Marked as read' });
});

module.exports = { overview, compliance, invoices, documents, ledger, tasks, messages, sendMessage, markMessagesRead };
