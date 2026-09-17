const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const AppError = require('../../../utils/AppError');
const ledgerService = require('../services/ledger.service');
const booksService = require('../services/books.service');
const { parseLedgerExcel } = require('../utils/parseLedgerExcel');

const addEntry = asyncHandler(async (req, res) => {
  const entry = await ledgerService.addEntry(req.user.firmId, req.user.id, req.body);
  return ApiResponse.created(res, { message: 'Ledger entry recorded', data: { entry } });
});

const statement = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const result = await ledgerService.getStatement(req.user.firmId, req.params.clientId, { from, to });
  return ApiResponse.success(res, { data: result });
});

const balance = asyncHandler(async (req, res) => {
  const currentBalance = await ledgerService.getCurrentBalance(req.user.firmId, req.params.clientId);
  return ApiResponse.success(res, { data: { currentBalance } });
});

const book = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const result = await booksService.getBook(req.user.firmId, req.params.book, { from, to });
  return ApiResponse.success(res, { data: result });
});

const importEntries = asyncHandler(async (req, res) => {
  if (!req.file) throw AppError.badRequest('No file uploaded. Attach an .xlsx or .csv file.');
  const { valid, errors } = parseLedgerExcel(req.file.buffer);
  const { created, closingBalance } = await ledgerService.importEntries(
    req.user.firmId, req.user.id, req.params.clientId, valid
  );
  const skipped = errors.length;
  return ApiResponse.success(res, {
    message: created > 0
      ? `Imported ${created} entr${created === 1 ? 'y' : 'ies'}${skipped ? `, skipped ${skipped}` : ''}`
      : 'No valid entries found to import',
    data: { created, skipped, errors, closingBalance },
  });
});

module.exports = { addEntry, statement, balance, book, importEntries };
