import apiClient from '../../../services/apiClient';

export const dashboardApi = {
  overview: () => apiClient.get('/dashboard/overview').then((r) => r.data.data),
};
