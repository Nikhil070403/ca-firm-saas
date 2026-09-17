import apiClient from '../../../services/apiClient';

export const portalApi = {
  overview: () => apiClient.get('/portal/overview').then((r) => r.data.data),
  compliance: (params) => apiClient.get('/portal/compliance', { params }).then((r) => r.data),
  invoices: (params) => apiClient.get('/portal/invoices', { params }).then((r) => r.data),
  documents: (params) => apiClient.get('/portal/documents', { params }).then((r) => r.data),
  ledger: (params) => apiClient.get('/portal/ledger', { params }).then((r) => r.data.data),
  tasks: (params) => apiClient.get('/portal/tasks', { params }).then((r) => r.data),
  messages: () => apiClient.get('/portal/messages').then((r) => r.data.data.messages),
  sendMessage: (body) => apiClient.post('/portal/messages', { body }).then((r) => r.data.data.message),
  markMessagesRead: () => apiClient.patch('/portal/messages/read').then((r) => r.data),
};
