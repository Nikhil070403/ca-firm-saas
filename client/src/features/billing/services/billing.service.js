import apiClient from '../../../services/apiClient';

export const invoiceApi = {
  list: (params) => apiClient.get('/invoices', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/invoices/${id}`).then((r) => r.data.data.invoice),
  create: (payload) => apiClient.post('/invoices', payload).then((r) => r.data.data.invoice),
  updateStatus: (id, status) => apiClient.patch(`/invoices/${id}/status`, { status }).then((r) => r.data.data.invoice),
  remove: (id) => apiClient.delete(`/invoices/${id}`).then((r) => r.data),
};

export const receiptApi = {
  list: (params) => apiClient.get('/receipts', { params }).then((r) => r.data),
  create: (payload) => apiClient.post('/receipts', payload).then((r) => r.data.data.receipt),
};

export const expenseApi = {
  list: (params) => apiClient.get('/expenses', { params }).then((r) => r.data),
  create: (payload) => apiClient.post('/expenses', payload).then((r) => r.data.data.expense),
  update: (id, payload) => apiClient.patch(`/expenses/${id}`, payload).then((r) => r.data.data.expense),
  remove: (id) => apiClient.delete(`/expenses/${id}`).then((r) => r.data),
  totalsByCategory: () => apiClient.get('/expenses/totals-by-category').then((r) => r.data.data.totals),
  review: (id, decision, reason) => apiClient.patch(`/expenses/${id}/review`, { decision, reason }).then((r) => r.data.data.expense),
};

export const INVOICE_STATUSES = ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'];
export const PAYMENT_MODES = ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'];
export const EXPENSE_CATEGORIES = ['office', 'travel', 'software', 'salary', 'rent', 'utilities', 'professional_fees', 'other'];
