import apiClient from '../../../services/apiClient';

export const taskTemplateApi = {
  list: () => apiClient.get('/task-templates').then((r) => r.data.data.templates),
  create: (payload) => apiClient.post('/task-templates', payload).then((r) => r.data.data.template),
  update: (id, payload) => apiClient.patch(`/task-templates/${id}`, payload).then((r) => r.data.data.template),
  remove: (id) => apiClient.delete(`/task-templates/${id}`).then((r) => r.data),
  apply: (id, payload) => apiClient.post(`/task-templates/${id}/apply`, payload).then((r) => r.data.data.task),
};
