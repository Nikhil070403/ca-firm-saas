const attendanceRepository = require('../repositories/attendance.repository');
const User = require('../../auth/models/User.model');
const AppError = require('../../../utils/AppError');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function checkIn(firmId, userId) {
  const date = todayStr();
  let record = await attendanceRepository.findOne(firmId, { userId, date });
  if (record?.checkInAt) throw AppError.badRequest('Already checked in today');

  if (record) {
    record.checkInAt = new Date();
    await record.save();
  } else {
    record = await attendanceRepository.create(firmId, { userId, date, checkInAt: new Date() });
  }
  return record;
}

async function checkOut(firmId, userId) {
  const date = todayStr();
  const record = await attendanceRepository.findOne(firmId, { userId, date });
  if (!record?.checkInAt) throw AppError.badRequest('Check in before checking out');
  if (record.checkOutAt) throw AppError.badRequest('Already checked out today');

  record.checkOutAt = new Date();
  await record.save();
  return record;
}

async function myHistory(firmId, userId, month) {
  const filter = { userId };
  if (month) filter.date = { $regex: `^${month}` };
  return attendanceRepository.find(firmId, filter, { sort: { date: -1 } });
}

// Admin view: every active staff member for the day, present or not — a
// staff member with no Attendance row for `date` is just as meaningful
// (absent) as one who checked in, so this starts from the User list rather
// than the Attendance collection.
async function teamByDate(firmId, date, departmentId) {
  const userFilter = { firmId, isDeleted: false, isActive: true, role: { $ne: 'client' } };
  if (departmentId) userFilter.departmentId = departmentId;

  const [staff, records] = await Promise.all([
    User.find(userFilter).select('name email avatarUrl departmentId').lean(),
    attendanceRepository.find(firmId, { date }),
  ]);

  const byUser = Object.fromEntries(records.map((r) => [r.userId.toString(), r]));
  return staff.map((u) => ({
    user: { id: u._id, name: u.name, email: u.email, avatarUrl: u.avatarUrl },
    checkInAt: byUser[u._id.toString()]?.checkInAt || null,
    checkOutAt: byUser[u._id.toString()]?.checkOutAt || null,
  }));
}

async function monthlySummary(firmId, month) {
  const records = await attendanceRepository.find(firmId, { date: { $regex: `^${month}` }, checkInAt: { $ne: null } });
  const counts = {};
  records.forEach((r) => {
    const key = r.userId.toString();
    counts[key] = (counts[key] || 0) + 1;
  });

  const staff = await User.find({ firmId, isDeleted: false, isActive: true, role: { $ne: 'client' } })
    .select('name email').lean();
  return staff.map((u) => ({
    user: { id: u._id, name: u.name, email: u.email },
    daysPresent: counts[u._id.toString()] || 0,
  }));
}

module.exports = { checkIn, checkOut, myHistory, teamByDate, monthlySummary };
