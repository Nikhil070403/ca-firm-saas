import apiClient from '../../../services/apiClient';

export const complianceApi = {
  list: (params) => apiClient.get('/compliance', { params }).then((r) => r.data),
  generate: () => apiClient.post('/compliance/generate').then((r) => r.data),
  markFiled: (id) => apiClient.patch(`/compliance/${id}/file`).then((r) => r.data),
  setTaxPayable: (id, amount) => apiClient.patch(`/compliance/${id}/tax-payable`, { amount }).then((r) => r.data),
};

export const RETURN_TYPE_LABELS = {
  gstr1: 'GSTR-1',
  gstr3b: 'GSTR-3B',
  itr: 'Income Tax Return',
  gstr9c: 'GSTR-9C',
  roc: 'ROC (MCA)',
  audit: 'Audit',
};

export const GST_FREQUENCIES = [
  { value: '', label: 'Not GST registered' },
  { value: 'monthly', label: 'Monthly (R1 by 11th, 3B by 20th)' },
  { value: 'quarterly', label: 'Quarterly (R1 by 13th, 3B by 24th)' },
];

export const ITR_FORMS = [
  { value: '', label: 'Not applicable' },
  { value: 'itr1', label: 'ITR-1' },
  { value: 'itr2', label: 'ITR-2' },
  { value: 'itr3', label: 'ITR-3' },
  { value: 'itr4', label: 'ITR-4' },
  { value: 'itr5', label: 'ITR-5' },
  { value: 'itr6', label: 'ITR-6' },
];
