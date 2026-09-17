const taskRepository = require('../repositories/task.repository');
const notificationService = require('../../reminders/services/notification.service');
const AppError = require('../../../utils/AppError');
const { parseListQuery } = require('../../../utils/pagination');
const { isAutomationEnabled } = require('../../../utils/firmAutomation');

// Coarse status implied by each Kanban stage — keeps dashboards/reports
// truthful without asking staff to maintain two fields.
const STAGE_TO_STATUS = {
  document_collection: 'todo',
  verification: 'in_progress',
  preparation: 'in_progress',
  review: 'in_review',
  partner_approval: 'in_review',
  filed: 'done',
  completed: 'done',
};

function withStageSync(updates) {
  if (updates.stage && !updates.status) {
    return { ...updates, status: STAGE_TO_STATUS[updates.stage] };
  }
  return updates;
}

async function listTasks(firmId, query) {
  const { page, limit, skip, sort, filters, searchClause } = parseListQuery(query, {
    searchableFields: ['title', 'description'],
    allowedFilters: ['status', 'stage', 'priority', 'clientId', 'assignedTo'],
  });
  const filter = { ...filters, ...(searchClause || {}) };
  const { items, total } = await taskRepository.paginate(firmId, {
    filter,
    sort,
    skip,
    limit,
    populate: [{ path: 'assignedTo', select: 'name email avatarUrl' }, { path: 'clientId', select: 'displayName' }],
  });
  return { items, page, limit, total };
}

async function getStatusCounts(firmId) {
  return taskRepository.countByStatus(firmId);
}

async function createTask(firmId, actorId, data) {
  const task = await taskRepository.create(firmId, { ...withStageSync(data), createdBy: actorId });
  if (task.assignedTo && (await isAutomationEnabled(firmId, 'taskAssignmentNotify'))) {
    await notificationService.notify({
      firmId,
      userId: task.assignedTo,
      type: 'task_assigned',
      title: `New task: ${task.title}`,
      message: task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date set',
      link: `/crm/tasks/${task._id}`,
      sourceId: task._id,
      sourceType: 'task',
    });
  }
  return task;
}

async function getTask(firmId, id) {
  const task = await taskRepository.findById(firmId, id, {
    populate: [
      { path: 'assignedTo', select: 'name email avatarUrl' },
      { path: 'clientId', select: 'displayName' },
      { path: 'comments.authorId', select: 'name avatarUrl' },
    ],
  });
  if (!task) throw AppError.notFound('Task not found');
  return task;
}

async function updateTask(firmId, id, actorId, updates) {
  const task = await taskRepository.updateById(firmId, id, withStageSync(updates), { updatedBy: actorId });
  if (!task) throw AppError.notFound('Task not found');
  return task;
}

async function deleteTask(firmId, id, actorId) {
  const task = await taskRepository.softDelete(firmId, id, { deletedBy: actorId });
  if (!task) throw AppError.notFound('Task not found');
  return task;
}

async function addChecklistItem(firmId, id, label) {
  const task = await taskRepository.pushChecklistItem(firmId, id, { label, isDone: false });
  if (!task) throw AppError.notFound('Task not found');
  return task;
}

async function toggleChecklistItem(firmId, id, itemId, isDone) {
  const task = await taskRepository.toggleChecklistItem(firmId, id, itemId, isDone);
  if (!task) throw AppError.notFound('Task or checklist item not found');
  return task;
}

async function removeChecklistItem(firmId, id, itemId) {
  const task = await taskRepository.removeChecklistItem(firmId, id, itemId);
  if (!task) throw AppError.notFound('Task not found');
  return task;
}

async function addComment(firmId, id, authorId, message) {
  const task = await taskRepository.pushComment(firmId, id, { authorId, message, createdAt: new Date() });
  if (!task) throw AppError.notFound('Task not found');
  return task;
}

async function logTime(firmId, id, userId, minutes, note) {
  const task = await taskRepository.pushTimeLog(firmId, id, { userId, minutes, note, loggedAt: new Date() });
  if (!task) throw AppError.notFound('Task not found');
  return task;
}

module.exports = {
  listTasks,
  getStatusCounts,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  addChecklistItem,
  toggleChecklistItem,
  removeChecklistItem,
  addComment,
  logTime,
};
