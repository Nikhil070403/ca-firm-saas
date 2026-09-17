import apiClient from '../../../services/apiClient';

export const ledgerApi = {
  addEntry: (payload) => apiClient.post('/khatabook/entries', payload).then((r) => r.data.data.entry),
  statement: (clientId, params) => apiClient.get(`/khatabook/clients/${clientId}/statement`, { params }).then((r) => r.data.data),
  balance: (clientId) => apiClient.get(`/khatabook/clients/${clientId}/balance`).then((r) => r.data.data.currentBalance),
  importExcel: (clientId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post(`/khatabook/clients/${clientId}/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
};
