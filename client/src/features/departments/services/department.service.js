import apiClient from '../../../services/apiClient';

export const departmentApi = {
  list: () => apiClient.get('/departments').then((r) => r.data.data.departments),
  create: (payload) => apiClient.post('/departments', payload).then((r) => r.data.data.department),
  update: (id, payload) => apiClient.patch(`/departments/${id}`, payload).then((r) => r.data.data.department),
  remove: (id) => apiClient.delete(`/departments/${id}`).then((r) => r.data),
};
