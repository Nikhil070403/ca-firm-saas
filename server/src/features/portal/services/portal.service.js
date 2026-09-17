const clientService = require('../../clients/services/client.service');
const ledgerService = require('../../khatabook/services/ledger.service');
const complianceService = require('../../compliance/services/compliance.service');
const invoiceService = require('../../billing/services/invoice.service');
const documentService = require('../../documents/services/document.service');
const taskService = require('../../tasks/services/task.service');
const messageService = require('../../messages/services/message.service');
const AppError = require('../../../utils/AppError');

/**
 * Every function here takes the CLIENT'S OWN linkedClientId, never a
 * client-supplied id — that is what makes the portal impossible to point at
 * someone else's data. `requireLinkedClient` is the one gate every portal
 * controller calls first.
 */
function requireLinkedClient(user) {
  if (!user.linkedClientId) {
    throw AppError.forbidden('Your account is not yet linked to a client record. Contact your firm.');
  }
  return user.linkedClientId;
}

async function getOverview(firmId, clientId) {
  const [client, balance, complianceRes, invoicesRes, tasksRes, docsRes] = await Promise.all([
    clientService.getClient(firmId, clientId),
    ledgerService.getCurrentBalance(firmId, clientId),
    complianceService.listReturns(firmId, { clientId, status: 'pending', limit: 5, sort: 'dueDate' }),
    invoiceService.listInvoices(firmId, { clientId, limit: 5, sort: '-issueDate' }),
    taskService.listTasks(firmId, { clientId, limit: 5, sort: '-createdAt' }),
    documentService.listDocuments(firmId, { ownerType: 'client', ownerId: clientId, limit: 5, sort: '-createdAt' }),
  ]);

  const outstandingInvoices = invoicesRes.items.filter((i) => ['sent', 'partially_paid', 'overdue'].includes(i.status));
  const outstandingTotal = outstandingInvoices.reduce((acc, i) => acc + (i.grandTotal - i.amountPaid), 0);

  return {
    client,
    ledgerBalance: balance,
    pendingCompliance: complianceRes.items,
    pendingComplianceTotal: complianceRes.total,
    recentInvoices: invoicesRes.items,
    outstandingTotal,
    openTasks: tasksRes.items.filter((t) => t.status !== 'done'),
    recentDocuments: docsRes.items,
  };
}

async function listCompliance(firmId, clientId, query) {
  return complianceService.listReturns(firmId, { ...query, clientId });
}

async function listInvoices(firmId, clientId, query) {
  return invoiceService.listInvoices(firmId, { ...query, clientId });
}

async function listDocuments(firmId, clientId, query) {
  return documentService.listDocuments(firmId, { ...query, ownerType: 'client', ownerId: clientId });
}

async function getLedger(firmId, clientId, range) {
  return ledgerService.getStatement(firmId, clientId, range);
}

async function listTasks(firmId, clientId, query) {
  return taskService.listTasks(firmId, { ...query, clientId });
}

async function listMessages(firmId, clientId) {
  return messageService.listThread(firmId, clientId);
}

async function sendMessage(firmId, clientId, senderId, body) {
  return messageService.sendMessage(firmId, clientId, senderId, 'client', body);
}

async function markMessagesRead(firmId, clientId) {
  return messageService.markRead(firmId, clientId, 'client');
}

module.exports = {
  requireLinkedClient,
  getOverview,
  listCompliance,
  listInvoices,
  listDocuments,
  getLedger,
  listTasks,
  listMessages,
  sendMessage,
  markMessagesRead,
};
