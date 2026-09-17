const mongoose = require('mongoose');
const Receipt = require('../../billing/models/Receipt.model');
const Expense = require('../../billing/models/Expense.model');
const Invoice = require('../../billing/models/Invoice.model');
const AppError = require('../../../utils/AppError');

const CASH_MODES = ['cash'];

/**
 * Tally-style firm books derived from existing vouchers — receipts (money
 * in), expenses (money out) and invoices (sales register). Books are
 * presentations over the same data, not separate stores, so they can never
 * disagree with billing.
 */

function rangeFilter(field, from, to) {
  const clause = {};
  if (from) clause.$gte = new Date(from);
  if (to) clause.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  return Object.keys(clause).length ? { [field]: clause } : {};
}

async function moneyRows(firmId, { from, to, modes }) {
  const firmObjectId = new mongoose.Types.ObjectId(firmId);
  const modeFilter = modes ? { paymentMode: modes.negate ? { $nin: modes.list } : { $in: modes.list } } : {};

  const [receipts, expenses] = await Promise.all([
    Receipt.find({ firmId: firmObjectId, isDeleted: false, ...modeFilter, ...rangeFilter('receivedDate', from, to) })
      .populate('clientId', 'displayName').sort({ receivedDate: 1 }),
    Expense.find({ firmId: firmObjectId, isDeleted: false, ...modeFilter, ...rangeFilter('expenseDate', from, to) })
      .sort({ expenseDate: 1 }),
  ]);

  const rows = [
    ...receipts.map((r) => ({
      date: r.receivedDate,
      voucherType: 'Receipt',
      reference: r.receiptNumber,
      particulars: r.clientId?.displayName || 'Receipt',
      mode: r.paymentMode,
      inflow: r.amount,
      outflow: 0,
    })),
    ...expenses.map((e) => ({
      date: e.expenseDate,
      voucherType: 'Expense',
      reference: (e.category || '').replace(/_/g, ' '),
      particulars: e.title,
      mode: e.paymentMode,
      inflow: 0,
      outflow: e.amount,
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  let balance = 0;
  for (const row of rows) {
    balance += row.inflow - row.outflow;
    row.balance = balance;
  }
  return rows;
}

async function salesRows(firmId, { from, to }) {
  const invoices = await Invoice.find({
    firmId: new mongoose.Types.ObjectId(firmId),
    isDeleted: false,
    status: { $ne: 'cancelled' },
    ...rangeFilter('issueDate', from, to),
  }).populate('clientId', 'displayName gstNumber').sort({ issueDate: 1 });

  return invoices.map((inv) => ({
    date: inv.issueDate,
    voucherType: 'Sales',
    reference: inv.invoiceNumber,
    particulars: inv.clientId?.displayName || '—',
    gstNumber: inv.clientId?.gstNumber || null,
    taxable: inv.subtotal,
    tax: inv.taxTotal,
    inflow: inv.grandTotal,
    outflow: 0,
    received: inv.amountPaid,
    status: inv.status,
  }));
}

async function getBook(firmId, book, { from, to }) {
  switch (book) {
    case 'daybook':
      return { book, rows: await moneyRows(firmId, { from, to }) };
    case 'cashbook':
      return { book, rows: await moneyRows(firmId, { from, to, modes: { list: CASH_MODES } }) };
    case 'bankbook':
      return { book, rows: await moneyRows(firmId, { from, to, modes: { list: CASH_MODES, negate: true } }) };
    case 'sales':
      return { book, rows: await salesRows(firmId, { from, to }) };
    case 'expenses': {
      const rows = await moneyRows(firmId, { from, to });
      return { book, rows: rows.filter((r) => r.voucherType === 'Expense') };
    }
    default:
      throw AppError.badRequest(`Unknown book "${book}". Use daybook, cashbook, bankbook, sales or expenses.`);
  }
}

module.exports = { getBook };
