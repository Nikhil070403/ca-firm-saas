import apiClient from '../../../services/apiClient';

export const taskApi = {
  list: (params) => apiClient.get('/tasks', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/tasks/${id}`).then((r) => r.data.data.task),
  create: (payload) => apiClient.post('/tasks', payload).then((r) => r.data.data.task),
  update: (id, payload) => apiClient.patch(`/tasks/${id}`, payload).then((r) => r.data.data.task),
  remove: (id) => apiClient.delete(`/tasks/${id}`).then((r) => r.data),
  addChecklistItem: (id, label) => apiClient.post(`/tasks/${id}/checklist`, { label }).then((r) => r.data.data.task),
  toggleChecklistItem: (id, itemId, isDone) => apiClient.patch(`/tasks/${id}/checklist/${itemId}`, { isDone }).then((r) => r.data.data.task),
  removeChecklistItem: (id, itemId) => apiClient.delete(`/tasks/${id}/checklist/${itemId}`).then((r) => r.data.data.task),
  addComment: (id, message) => apiClient.post(`/tasks/${id}/comments`, { message }).then((r) => r.data.data.task),
  logTime: (id, minutes, note) => apiClient.post(`/tasks/${id}/time-logs`, { minutes, note }).then((r) => r.data.data.task),
};

export const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
