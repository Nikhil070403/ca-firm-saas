const receiptRepository = require('../repositories/receipt.repository');
const clientService = require('../../clients/services/client.service');
const ledgerService = require('../../khatabook/services/ledger.service');
const invoiceService = require('./invoice.service');
const AppError = require('../../../utils/AppError');
const { parseListQuery } = require('../../../utils/pagination');

async function generateReceiptNumber(firmId) {
  const count = await receiptRepository.countForFirm(firmId);
  const year = new Date().getFullYear();
  return `RCPT-${year}-${String(count + 1).padStart(4, '0')}`;
}

async function listReceipts(firmId, query) {
  const { page, limit, skip, sort, filters, searchClause } = parseListQuery(query, {
    searchableFields: ['receiptNumber', 'paymentReference'],
    allowedFilters: ['clientId', 'invoiceId', 'paymentMode'],
  });
  const filter = { ...filters, ...(searchClause || {}) };
  const { items, total } = await receiptRepository.paginate(firmId, {
    filter,
    sort,
    skip,
    limit,
    populate: [{ path: 'clientId', select: 'displayName' }, { path: 'invoiceId', select: 'invoiceNumber' }],
  });
  return { items, page, limit, total };
}

async function createReceipt(firmId, actorId, data) {
  await clientService.getClient(firmId, data.clientId);
  const receiptNumber = await generateReceiptNumber(firmId);

  const receipt = await receiptRepository.create(firmId, {
    receiptNumber,
    clientId: data.clientId,
    invoiceId: data.invoiceId || null,
    amount: data.amount,
    paymentMode: data.paymentMode || 'bank_transfer',
    paymentReference: data.paymentReference || null,
    receivedDate: data.receivedDate || new Date(),
    notes: data.notes || '',
    createdBy: actorId,
  });

  await ledgerService.addEntry(firmId, actorId, {
    clientId: data.clientId,
    entryType: 'credit',
    amount: data.amount,
    description: `Receipt ${receipt.receiptNumber}`,
    receiptId: receipt._id,
    entryDate: receipt.receivedDate,
  });

  if (data.invoiceId) {
    await invoiceService.applyPayment(firmId, data.invoiceId, actorId, data.amount);
  }

  return receipt;
}

async function getReceipt(firmId, id) {
  const receipt = await receiptRepository.findById(firmId, id, {
    populate: [{ path: 'clientId', select: 'displayName' }, { path: 'invoiceId', select: 'invoiceNumber' }],
  });
  if (!receipt) throw AppError.notFound('Receipt not found');
  return receipt;
}

module.exports = { listReceipts, createReceipt, getReceipt };
