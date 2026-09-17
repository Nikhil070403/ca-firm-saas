import apiClient from '../../../services/apiClient';

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => apiClient.post('/auth/login', payload).then((r) => r.data.data),
  refresh: () => apiClient.post('/auth/refresh').then((r) => r.data.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data.data),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }).then((r) => r.data),
  verifyEmail: (token) => apiClient.post('/auth/verify-email', { token }).then((r) => r.data.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data.data),
  updateMe: (payload) => apiClient.patch('/auth/me', payload).then((r) => r.data.data.user),
  verifyLoginTwoFactor: (tempToken, code) => apiClient.post('/auth/2fa/verify-login', { tempToken, code }).then((r) => r.data.data),
  setupTwoFactor: () => apiClient.post('/auth/2fa/setup').then((r) => r.data.data),
  enableTwoFactor: (token) => apiClient.post('/auth/2fa/enable', { token }).then((r) => r.data.data),
  disableTwoFactor: (password) => apiClient.post('/auth/2fa/disable', { password }).then((r) => r.data),
  changePassword: (currentPassword, newPassword) => apiClient.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),
  listSessions: () => apiClient.get('/auth/sessions').then((r) => r.data.data.sessions),
  revokeSession: (id) => apiClient.delete(`/auth/sessions/${id}`).then((r) => r.data),
  revokeOtherSessions: () => apiClient.post('/auth/sessions/revoke-others').then((r) => r.data),
};
