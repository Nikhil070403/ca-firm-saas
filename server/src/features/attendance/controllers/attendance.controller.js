const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/ApiResponse');
const attendanceService = require('../services/attendance.service');

const checkIn = asyncHandler(async (req, res) => {
  const record = await attendanceService.checkIn(req.user.firmId, req.user.id);
  return ApiResponse.success(res, { message: 'Checked in', data: { record } });
});

const checkOut = asyncHandler(async (req, res) => {
  const record = await attendanceService.checkOut(req.user.firmId, req.user.id);
  return ApiResponse.success(res, { message: 'Checked out', data: { record } });
});

const myHistory = asyncHandler(async (req, res) => {
  const records = await attendanceService.myHistory(req.user.firmId, req.user.id, req.query.month);
  return ApiResponse.success(res, { data: { records } });
});

const teamByDate = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const entries = await attendanceService.teamByDate(req.user.firmId, date, req.query.departmentId);
  return ApiResponse.success(res, { data: { date, entries } });
});

const monthlySummary = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const summary = await attendanceService.monthlySummary(req.user.firmId, month);
  return ApiResponse.success(res, { data: { month, summary } });
});

module.exports = { checkIn, checkOut, myHistory, teamByDate, monthlySummary };
