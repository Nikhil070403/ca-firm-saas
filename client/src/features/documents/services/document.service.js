import apiClient from '../../../services/apiClient';

export const documentApi = {
  list: (params) => apiClient.get('/documents', { params }).then((r) => r.data),
  upload: (file, meta) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(meta).forEach(([key, value]) => value !== undefined && formData.append(key, value));
    return apiClient.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.document);
  },
  uploadNewVersion: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/documents/${id}/versions`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.document);
  },
  review: (id, decision, reason) => apiClient.patch(`/documents/${id}/review`, { decision, reason }).then((r) => r.data.data.document),
  remove: (id) => apiClient.delete(`/documents/${id}`).then((r) => r.data),
};
