import apiClient from '../../../services/apiClient';

export const attendanceApi = {
  checkIn: () => apiClient.post('/attendance/check-in').then((r) => r.data.data.record),
  checkOut: () => apiClient.post('/attendance/check-out').then((r) => r.data.data.record),
  myHistory: (month) => apiClient.get('/attendance/me', { params: { month } }).then((r) => r.data.data.records),
  teamByDate: (date, departmentId) => apiClient.get('/attendance/team', { params: { date, departmentId } }).then((r) => r.data.data),
  monthlySummary: (month) => apiClient.get('/attendance/summary', { params: { month } }).then((r) => r.data.data),
};
