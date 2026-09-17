const XLSX = require('xlsx');

// Accepts loose spellings/shorthand so a firm's existing sheet imports without
// reformatting. Header matching is case-insensitive and by keyword.
const TYPE_ALIASES = {
  dr: 'debit',
  debit: 'debit',
  cr: 'credit',
  credit: 'credit',
  adjustment: 'adjustment',
  adj: 'adjustment',
  opening: 'opening_balance',
  opening_balance: 'opening_balance',
  'opening balance': 'opening_balance',
};

function pick(row, regex) {
  const key = Object.keys(row).find((k) => regex.test(k));
  return key !== undefined ? row[key] : undefined;
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  return Number(String(value ?? '').replace(/[,₹\s]/g, ''));
}

function toDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Parses an uploaded ledger workbook (first sheet) into ready-to-insert
 * entries. Expected columns (any order, case-insensitive):
 *   Date | Type | Amount | Description | Reference | Direction
 * Returns { valid, errors } — invalid rows are reported with a 1-based row
 * number (accounting for the header) and skipped, never silently dropped.
 */
function parseLedgerExcel(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { valid: [], errors: [{ row: 0, message: 'The file has no sheets' }] };

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
  const valid = [];
  const errors = [];

  rows.forEach((row, i) => {
    const rowNum = i + 2; // +1 for header, +1 for 1-based
    const rawType = String(pick(row, /type/i) ?? '').trim().toLowerCase();
    const entryType = TYPE_ALIASES[rawType];
    const amount = toNumber(pick(row, /amount|amt/i));
    const description = String(pick(row, /desc|particular|narration/i) ?? '').trim();
    const reference = String(pick(row, /ref/i) ?? '').trim() || null;
    const rawDir = String(pick(row, /direction|dir/i) ?? '').trim().toLowerCase();
    const direction = rawDir === 'decrease' ? 'decrease' : 'increase';

    if (!rawType && !description && !amount) return; // blank row — ignore silently
    if (!entryType) {
      errors.push({ row: rowNum, message: `Unknown type "${rawType || '(blank)'}" — use debit, credit, adjustment or opening_balance` });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push({ row: rowNum, message: 'Amount must be a number greater than 0' });
      return;
    }
    if (!description) {
      errors.push({ row: rowNum, message: 'Description is required' });
      return;
    }

    valid.push({
      entryType,
      amount,
      direction: entryType === 'adjustment' ? direction : null,
      description,
      reference,
      entryDate: toDate(pick(row, /date/i)),
    });
  });

  return { valid, errors };
}

module.exports = { parseLedgerExcel };
