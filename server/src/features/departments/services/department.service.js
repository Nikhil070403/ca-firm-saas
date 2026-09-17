const mongoose = require('mongoose');
const departmentRepository = require('../repositories/department.repository');
const User = require('../../auth/models/User.model');
const AppError = require('../../../utils/AppError');

async function listDepartments(firmId) {
  const departments = await departmentRepository.find(firmId, {}, {
    sort: { name: 1 },
    populate: { path: 'headUserId', select: 'name avatarUrl' },
  });
  const counts = await User.aggregate([
    { $match: { firmId: new mongoose.Types.ObjectId(firmId), isDeleted: false, departmentId: { $ne: null } } },
    { $group: { _id: '$departmentId', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  return departments.map((d) => ({ ...d.toObject(), memberCount: countMap[d._id.toString()] || 0 }));
}

async function createDepartment(firmId, actorId, data) {
  return departmentRepository.create(firmId, { ...data, createdBy: actorId });
}

async function updateDepartment(firmId, id, actorId, updates) {
  const department = await departmentRepository.updateById(firmId, id, updates, { updatedBy: actorId });
  if (!department) throw AppError.notFound('Department not found');
  return department;
}

async function deleteDepartment(firmId, id, actorId) {
  const department = await departmentRepository.softDelete(firmId, id, { deletedBy: actorId });
  if (!department) throw AppError.notFound('Department not found');
  // Don't leave members pointing at a deleted department.
  await User.updateMany({ firmId, departmentId: id }, { $set: { departmentId: null } });
  return department;
}

module.exports = { listDepartments, createDepartment, updateDepartment, deleteDepartment };
