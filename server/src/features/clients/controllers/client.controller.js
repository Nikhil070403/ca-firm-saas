const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const clientService = require('../services/client.service');
const riskService = require('../services/risk.service');
const messageService = require('../../messages/services/message.service');

const list = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await clientService.listClients(req.user.firmId, req.query, req.user);
  return ApiResponse.paginated(res, { items, page, limit, total });
});

const create = asyncHandler(async (req, res) => {
  const client = await clientService.createClient(req.user.firmId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Client created', data: { client } });
});

const getOne = asyncHandler(async (req, res) => {
  const client = await clientService.getClient(req.user.firmId, req.params.id, req.user);
  return ApiResponse.success(res, { data: { client } });
});

const update = asyncHandler(async (req, res) => {
  const client = await clientService.updateClient(req.user.firmId, req.params.id, req.user.id, req.body);
  return ApiResponse.success(res, { message: 'Client updated', data: { client } });
});

const remove = asyncHandler(async (req, res) => {
  await clientService.deleteClient(req.user.firmId, req.params.id, req.user.id);
  return ApiResponse.success(res, { message: 'Client deleted' });
});

const addContact = asyncHandler(async (req, res) => {
  const client = await clientService.addContactPerson(req.user.firmId, req.params.id, req.body);
  return ApiResponse.created(res, { message: 'Contact added', data: { client } });
});

const removeContact = asyncHandler(async (req, res) => {
  const client = await clientService.removeContactPerson(req.user.firmId, req.params.id, req.params.contactId);
  return ApiResponse.success(res, { message: 'Contact removed', data: { client } });
});

const timeline = asyncHandler(async (req, res) => {
  const events = await clientService.getTimeline(req.user.firmId, req.params.id);
  return ApiResponse.success(res, { data: { events } });
});

const risk = asyncHandler(async (req, res) => {
  const result = await riskService.getClientRisk(req.user.firmId, req.params.id);
  return ApiResponse.success(res, { data: { risk: result } });
});

const riskOverview = asyncHandler(async (req, res) => {
  const clients = await riskService.getRiskOverview(req.user.firmId);
  return ApiResponse.success(res, { data: { clients } });
});

const listCommunications = asyncHandler(async (req, res) => {
  const communications = await clientService.listCommunications(req.user.firmId, req.params.id);
  return ApiResponse.success(res, { data: { communications } });
});

const logCommunication = asyncHandler(async (req, res) => {
  const entry = await clientService.logCommunication(req.user.firmId, req.params.id, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Communication logged', data: { communication: entry } });
});

const listMessages = asyncHandler(async (req, res) => {
  const messages = await messageService.listThread(req.user.firmId, req.params.id);
  return ApiResponse.success(res, { data: { messages } });
});

const sendMessage = asyncHandler(async (req, res) => {
  const message = await messageService.sendMessage(req.user.firmId, req.params.id, req.user.id, 'staff', req.body.body);
  return ApiResponse.created(res, { message: 'Message sent', data: { message } });
});

const markMessagesRead = asyncHandler(async (req, res) => {
  await messageService.markRead(req.user.firmId, req.params.id, 'staff');
  return ApiResponse.success(res, { message: 'Marked as read' });
});

const bulkAssign = asyncHandler(async (req, res) => {
  const result = await clientService.bulkAssign(req.user.firmId, req.body.ids, req.body.assignedTo);
  return ApiResponse.success(res, { message: `${result.modifiedCount} client(s) reassigned`, data: result });
});

module.exports = {
  list, create, getOne, update, remove, addContact, removeContact, timeline, risk, riskOverview,
  listCommunications, logCommunication, listMessages, sendMessage, markMessagesRead, bulkAssign,
};
