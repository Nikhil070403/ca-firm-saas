import apiClient from '../../../services/apiClient';

export const clientApi = {
  list: (params) => apiClient.get('/clients', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/clients/${id}`).then((r) => r.data.data.client),
  create: (payload) => apiClient.post('/clients', payload).then((r) => r.data.data.client),
  update: (id, payload) => apiClient.patch(`/clients/${id}`, payload).then((r) => r.data.data.client),
  remove: (id) => apiClient.delete(`/clients/${id}`).then((r) => r.data),
  timeline: (id) => apiClient.get(`/clients/${id}/timeline`).then((r) => r.data.data.events),
  risk: (id) => apiClient.get(`/clients/${id}/risk`).then((r) => r.data.data.risk),
  riskOverview: () => apiClient.get('/clients/risk-overview').then((r) => r.data.data.clients),
  listCommunications: (id) => apiClient.get(`/clients/${id}/communications`).then((r) => r.data.data.communications),
  logCommunication: (id, payload) => apiClient.post(`/clients/${id}/communications`, payload).then((r) => r.data.data.communication),
  addContact: (id, payload) => apiClient.post(`/clients/${id}/contacts`, payload).then((r) => r.data.data.client),
  removeContact: (id, contactId) => apiClient.delete(`/clients/${id}/contacts/${contactId}`).then((r) => r.data.data.client),
  listMessages: (id) => apiClient.get(`/clients/${id}/messages`).then((r) => r.data.data.messages),
  sendMessage: (id, body) => apiClient.post(`/clients/${id}/messages`, { body }).then((r) => r.data.data.message),
  markMessagesRead: (id) => apiClient.patch(`/clients/${id}/messages/read`).then((r) => r.data),
  bulkAssign: (ids, assignedTo) => apiClient.patch('/clients/bulk-assign', { ids, assignedTo: assignedTo || null }).then((r) => r.data),
};
