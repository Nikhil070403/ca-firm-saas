const ledgerRepository = require('../repositories/ledger.repository');
const clientService = require('../../clients/services/client.service');
const AppError = require('../../../utils/AppError');

// Debit = client owes the firm more (e.g. invoice issued). Credit = client
// paid down what they owe (e.g. receipt recorded). Opening balance sets the
// starting point; adjustment moves the balance either way per `direction`.
function computeDelta(entryType, amount, direction) {
  switch (entryType) {
    case 'debit':
      return amount;
    case 'credit':
      return -amount;
    case 'opening_balance':
      return amount;
    case 'adjustment':
      return direction === 'decrease' ? -amount : amount;
    default:
      throw AppError.badRequest(`Unknown entry type: ${entryType}`);
  }
}

async function addEntry(firmId, actorId, data) {
  await clientService.getClient(firmId, data.clientId); // 404s if client doesn't exist/belongs to another firm

  const lastEntry = await ledgerRepository.findLastEntryForClient(firmId, data.clientId);
  const previousBalance = lastEntry ? lastEntry.runningBalance : 0;
  const delta = computeDelta(data.entryType, data.amount, data.direction);
  const runningBalance = data.entryType === 'opening_balance' ? delta : previousBalance + delta;

  return ledgerRepository.create(firmId, {
    clientId: data.clientId,
    entryType: data.entryType,
    direction: data.entryType === 'adjustment' ? (data.direction || 'increase') : null,
    amount: data.amount,
    runningBalance,
    description: data.description,
    reference: data.reference || null,
    invoiceId: data.invoiceId || null,
    receiptId: data.receiptId || null,
    entryDate: data.entryDate || new Date(),
    recordedBy: actorId,
  });
}

async function getStatement(firmId, clientId, { from, to } = {}) {
  const client = await clientService.getClient(firmId, clientId);
  const entries = await ledgerRepository.listForClient(firmId, clientId, { from, to });

  const openingBalance = entries.length > 0 ? entries[0].runningBalance - computeDelta(entries[0].entryType, entries[0].amount, entries[0].direction) : 0;
  const closingBalance = entries.length > 0 ? entries[entries.length - 1].runningBalance : 0;

  return { client, entries, openingBalance, closingBalance };
}

async function getCurrentBalance(firmId, clientId) {
  const lastEntry = await ledgerRepository.findLastEntryForClient(firmId, clientId);
  return lastEntry ? lastEntry.runningBalance : 0;
}

/**
 * Rewrites every running balance for a client in date order. Called after a
 * bulk import so balances stay correct even when imported rows are dated in
 * between (or before) existing entries — the whole column is recomputed, not
 * just appended.
 */
async function recomputeBalances(firmId, clientId) {
  const entries = await ledgerRepository.allForClient(firmId, clientId);
  let balance = 0;
  const updates = entries.map((entry) => {
    const delta = computeDelta(entry.entryType, entry.amount, entry.direction);
    balance = entry.entryType === 'opening_balance' ? delta : balance + delta;
    return { id: entry._id, runningBalance: balance };
  });
  await ledgerRepository.applyBalances(updates);
  return balance;
}

/**
 * Bulk-create ledger entries parsed from an uploaded sheet. Entries are
 * inserted, then the client's balances are recomputed once.
 */
async function importEntries(firmId, actorId, clientId, parsedRows) {
  await clientService.getClient(firmId, clientId); // 404s if not this firm's client
  if (parsedRows.length === 0) return { created: 0, closingBalance: await getCurrentBalance(firmId, clientId) };

  const docs = parsedRows.map((row) => ({
    clientId,
    entryType: row.entryType,
    direction: row.entryType === 'adjustment' ? (row.direction || 'increase') : null,
    amount: row.amount,
    runningBalance: 0, // placeholder; recomputed below
    description: row.description,
    reference: row.reference || null,
    entryDate: row.entryDate || new Date(),
    recordedBy: actorId,
  }));

  await ledgerRepository.bulkInsert(firmId, docs);
  const closingBalance = await recomputeBalances(firmId, clientId);
  return { created: docs.length, closingBalance };
}

module.exports = { addEntry, getStatement, getCurrentBalance, importEntries };
