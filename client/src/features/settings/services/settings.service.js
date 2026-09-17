import apiClient from '../../../services/apiClient';

export const userApi = {
  list: (params) => apiClient.get('/users', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/users/${id}`).then((r) => r.data.data.user),
  create: (payload) => apiClient.post('/users', payload).then((r) => r.data.data.user),
  update: (id, payload) => apiClient.patch(`/users/${id}`, payload).then((r) => r.data.data.user),
  setActive: (id, isActive) => apiClient.patch(`/users/${id}/status`, { isActive }).then((r) => r.data.data.user),
  remove: (id) => apiClient.delete(`/users/${id}`).then((r) => r.data),
};

export const firmApi = {
  get: () => apiClient.get('/settings/firm').then((r) => r.data.data.firm),
  update: (payload) => apiClient.patch('/settings/firm', payload).then((r) => r.data.data.firm),
  branding: () => apiClient.get('/settings/firm/branding').then((r) => r.data.data.branding),
};

// Full role catalog for display; which of these an actor may actually
// *assign* is narrower — see assignableRoles() in constants/roles.js.
export { ROLE_LABELS } from '../../../constants/roles';

export const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin (CA)' },
  { value: 'employee', label: 'Employee' },
  { value: 'client', label: 'Client' },
];

export const SERVICE_OPTIONS = [
  { value: 'crm', label: 'CRM' },
  { value: 'khata', label: 'Khata Book' },
  { value: 'accounts', label: 'Accounts' },
];
