import apiClient from '../../../services/apiClient';

export const reportApi = {
  revenue: (params) => apiClient.get('/reports/revenue', { params }).then((r) => r.data.data),
  outstanding: () => apiClient.get('/reports/outstanding').then((r) => r.data.data.rows),
  clientWise: () => apiClient.get('/reports/client-wise').then((r) => r.data.data.rows),
  employeeWise: () => apiClient.get('/reports/employee-wise').then((r) => r.data.data.rows),
  reminderWise: () => apiClient.get('/reports/reminder-wise').then((r) => r.data.data.rows),
  gst: (params) => apiClient.get('/reports/gst', { params }).then((r) => r.data.data.rows),
};

export async function downloadCsv(path, params, filename) {
  const response = await apiClient.get(path, { params: { ...params, format: 'csv' }, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
