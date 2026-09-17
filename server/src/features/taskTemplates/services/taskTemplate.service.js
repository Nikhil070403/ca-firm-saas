const taskTemplateRepository = require('../repositories/taskTemplate.repository');
const taskService = require('../../tasks/services/task.service');
const AppError = require('../../../utils/AppError');

async function listTemplates(firmId) {
  return taskTemplateRepository.find(firmId, {}, { sort: { name: 1 } });
}

async function createTemplate(firmId, actorId, data) {
  return taskTemplateRepository.create(firmId, { ...data, createdBy: actorId });
}

async function updateTemplate(firmId, id, actorId, updates) {
  const template = await taskTemplateRepository.updateById(firmId, id, updates, { updatedBy: actorId });
  if (!template) throw AppError.notFound('Template not found');
  return template;
}

async function deleteTemplate(firmId, id, actorId) {
  const template = await taskTemplateRepository.softDelete(firmId, id, { deletedBy: actorId });
  if (!template) throw AppError.notFound('Template not found');
  return template;
}

// Turns a template into a real Task — reuses task.service.createTask so the
// existing "notify the assignee" automation fires exactly like a manually
// created task would; nothing template-specific to duplicate there.
async function applyTemplate(firmId, actorId, templateId, { clientId, assignedTo, dueDate, title }) {
  const template = await taskTemplateRepository.findById(firmId, templateId);
  if (!template) throw AppError.notFound('Template not found');

  return taskService.createTask(firmId, actorId, {
    title: title || template.name,
    description: template.description,
    clientId: clientId || null,
    assignedTo: assignedTo || null,
    dueDate: dueDate || null,
    priority: template.defaultPriority,
    checklist: template.checklistItems.map((label) => ({ label, isDone: false })),
  });
}

module.exports = { listTemplates, createTemplate, updateTemplate, deleteTemplate, applyTemplate };
