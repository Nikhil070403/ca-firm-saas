const invoiceRepository = require('../repositories/invoice.repository');
const clientService = require('../../clients/services/client.service');
const ledgerService = require('../../khatabook/services/ledger.service');
const AppError = require('../../../utils/AppError');
const { parseListQuery } = require('../../../utils/pagination');

async function generateInvoiceNumber(firmId) {
  const count = await invoiceRepository.countForFirm(firmId);
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

function computeTotals(lineItems) {
  let subtotal = 0;
  let taxTotal = 0;
  const priced = lineItems.map((item) => {
    const amount = item.quantity * item.rate;
    const tax = amount * ((item.taxPercent || 0) / 100);
    subtotal += amount;
    taxTotal += tax;
    return { ...item, amount: Math.round((amount + tax) * 100) / 100 };
  });
  return { lineItems: priced, subtotal: round2(subtotal), taxTotal: round2(taxTotal), grandTotal: round2(subtotal + taxTotal) };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function listInvoices(firmId, query) {
  const { page, limit, skip, sort, filters, searchClause } = parseListQuery(query, {
    searchableFields: ['invoiceNumber'],
    allowedFilters: ['status', 'clientId'],
  });
  const filter = { ...filters, ...(searchClause || {}) };
  const { items, total } = await invoiceRepository.paginate(firmId, {
    filter,
    sort,
    skip,
    limit,
    populate: { path: 'clientId', select: 'displayName email' },
  });
  return { items, page, limit, total };
}

async function createInvoice(firmId, actorId, data) {
  await clientService.getClient(firmId, data.clientId);
  const totals = computeTotals(data.lineItems);
  const invoiceNumber = await generateInvoiceNumber(firmId);

  const invoice = await invoiceRepository.create(firmId, {
    invoiceNumber,
    clientId: data.clientId,
    issueDate: data.issueDate || new Date(),
    dueDate: data.dueDate,
    notes: data.notes || '',
    status: 'draft',
    createdBy: actorId,
    ...totals,
  });

  await ledgerService.addEntry(firmId, actorId, {
    clientId: data.clientId,
    entryType: 'debit',
    amount: invoice.grandTotal,
    description: `Invoice ${invoice.invoiceNumber}`,
    invoiceId: invoice._id,
    entryDate: invoice.issueDate,
  });

  return invoice;
}

async function getInvoice(firmId, id) {
  const invoice = await invoiceRepository.findById(firmId, id, {
    populate: { path: 'clientId', select: 'displayName email phone address gstNumber panNumber' },
  });
  if (!invoice) throw AppError.notFound('Invoice not found');
  return invoice;
}

async function updateStatus(firmId, id, actorId, status) {
  const invoice = await invoiceRepository.updateById(firmId, id, { status }, { updatedBy: actorId });
  if (!invoice) throw AppError.notFound('Invoice not found');
  return invoice;
}

// Called by billing/receipt.service after a receipt is recorded against
// this invoice, to keep amountPaid/status in sync.
async function applyPayment(firmId, id, actorId, amount) {
  const invoice = await invoiceRepository.findById(firmId, id);
  if (!invoice) throw AppError.notFound('Invoice not found');

  const amountPaid = round2(invoice.amountPaid + amount);
  const status = amountPaid >= invoice.grandTotal ? 'paid' : 'partially_paid';

  return invoiceRepository.updateById(firmId, id, { amountPaid, status }, { updatedBy: actorId });
}

async function deleteInvoice(firmId, id, actorId) {
  const invoice = await invoiceRepository.softDelete(firmId, id, { deletedBy: actorId });
  if (!invoice) throw AppError.notFound('Invoice not found');
  return invoice;
}

module.exports = { listInvoices, createInvoice, getInvoice, updateStatus, applyPayment, deleteInvoice };
