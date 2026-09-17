import apiClient from '../../../services/apiClient';

export const reminderApi = {
  list: (params) => apiClient.get('/reminders', { params }).then((r) => r.data),
  calendar: (params) => apiClient.get('/reminders/calendar', { params }).then((r) => r.data.data.reminders),
  create: (payload) => apiClient.post('/reminders', payload).then((r) => r.data.data.reminder),
  update: (id, payload) => apiClient.patch(`/reminders/${id}`, payload).then((r) => r.data.data.reminder),
  complete: (id) => apiClient.patch(`/reminders/${id}/complete`).then((r) => r.data.data.reminder),
  remove: (id) => apiClient.delete(`/reminders/${id}`).then((r) => r.data),
};

export const REMINDER_CATEGORIES = ['gst_return', 'it_return', 'tds', 'roc_filing', 'audit', 'renewal', 'license', 'custom'];
export const RECURRENCE_TYPES = ['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
