const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const reportService = require('../services/report.service');
const { toCsv } = require('../../../utils/csv');

function sendCsvIfRequested(req, res, rows, columns, filename) {
  if (req.query.format !== 'csv') return false;
  const csv = toCsv(rows, columns);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
  return true;
}

const revenue = asyncHandler(async (req, res) => {
  const data = await reportService.revenueReport(req.user.firmId, { monthsBack: Number(req.query.monthsBack) || 6 });
  return ApiResponse.success(res, { data });
});

const outstanding = asyncHandler(async (req, res) => {
  const rows = await reportService.outstandingReport(req.user.firmId);
  const columns = [
    { label: 'Invoice Number', value: (r) => r.invoiceNumber },
    { label: 'Client', value: (r) => r.clientId?.displayName },
    { label: 'Due Date', value: (r) => new Date(r.dueDate).toLocaleDateString() },
    { label: 'Grand Total', value: (r) => r.grandTotal },
    { label: 'Amount Paid', value: (r) => r.amountPaid },
    { label: 'Outstanding', value: (r) => r.grandTotal - r.amountPaid },
  ];
  if (sendCsvIfRequested(req, res, rows, columns, 'outstanding-report.csv')) return;
  return ApiResponse.success(res, { data: { rows } });
});

const clientWise = asyncHandler(async (req, res) => {
  const rows = await reportService.clientWiseReport(req.user.firmId);
  const columns = [
    { label: 'Client', value: (r) => r.client?.displayName },
    { label: 'GST Number', value: (r) => r.client?.gstNumber },
    { label: 'Total Billed', value: (r) => r.totalBilled },
    { label: 'Total Paid', value: (r) => r.totalPaid },
    { label: 'Outstanding', value: (r) => r.outstanding },
    { label: 'Invoice Count', value: (r) => r.invoiceCount },
  ];
  if (sendCsvIfRequested(req, res, rows, columns, 'client-wise-report.csv')) return;
  return ApiResponse.success(res, { data: { rows } });
});

const employeeWise = asyncHandler(async (req, res) => {
  const rows = await reportService.employeeWiseReport(req.user.firmId);
  return ApiResponse.success(res, { data: { rows } });
});

const reminderWise = asyncHandler(async (req, res) => {
  const rows = await reportService.reminderWiseReport(req.user.firmId);
  return ApiResponse.success(res, { data: { rows } });
});

const gst = asyncHandler(async (req, res) => {
  const rows = await reportService.gstReport(req.user.firmId, req.query);
  const columns = [
    { label: 'Invoice Number', value: (r) => r.invoiceNumber },
    { label: 'Date', value: (r) => new Date(r.issueDate).toLocaleDateString() },
    { label: 'Client', value: (r) => r.client?.displayName },
    { label: 'GST Number', value: (r) => r.client?.gstNumber },
    { label: 'Subtotal', value: (r) => r.subtotal },
    { label: 'Tax', value: (r) => r.taxTotal },
    { label: 'Grand Total', value: (r) => r.grandTotal },
  ];
  if (sendCsvIfRequested(req, res, rows, columns, 'gst-report.csv')) return;
  return ApiResponse.success(res, { data: { rows } });
});

const ledger = asyncHandler(async (req, res) => {
  const result = await reportService.ledgerReport(req.user.firmId, req.params.clientId, req.query);
  if (req.query.format === 'csv') {
    const columns = [
      { label: 'Date', value: (r) => new Date(r.entryDate).toLocaleDateString() },
      { label: 'Type', value: (r) => r.entryType },
      { label: 'Description', value: (r) => r.description },
      { label: 'Amount', value: (r) => r.amount },
      { label: 'Balance', value: (r) => r.runningBalance },
    ];
    const csv = toCsv(result.entries, columns);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ledger-report.csv"');
    return res.send(csv);
  }
  return ApiResponse.success(res, { data: result });
});

module.exports = { revenue, outstanding, clientWise, employeeWise, reminderWise, gst, ledger };
