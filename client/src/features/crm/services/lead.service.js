import apiClient from '../../../services/apiClient';

export const leadApi = {
  list: (params) => apiClient.get('/leads', { params }).then((r) => r.data),
  pipelineSummary: () => apiClient.get('/leads/pipeline-summary').then((r) => r.data.data.summary),
  sourceSummary: () => apiClient.get('/leads/source-summary').then((r) => r.data.data.summary),
  ownerSummary: () => apiClient.get('/leads/owner-summary').then((r) => r.data.data.summary),
  upcomingFollowUps: () => apiClient.get('/leads/followups/upcoming').then((r) => r.data.data.followUps),
  completeFollowUp: (activityId) => apiClient.patch(`/leads/followups/${activityId}/complete`).then((r) => r.data),
  get: (id) => apiClient.get(`/leads/${id}`).then((r) => r.data.data.lead),
  create: (payload) => apiClient.post('/leads', payload).then((r) => r.data.data.lead),
  update: (id, payload) => apiClient.patch(`/leads/${id}`, payload).then((r) => r.data.data.lead),
  remove: (id) => apiClient.delete(`/leads/${id}`).then((r) => r.data),
  listActivities: (id) => apiClient.get(`/leads/${id}/activities`).then((r) => r.data.data.activities),
  addActivity: (id, payload) => apiClient.post(`/leads/${id}/activities`, payload).then((r) => r.data.data.activity),
  convert: (id, payload) => apiClient.post(`/leads/${id}/convert`, payload).then((r) => r.data.data.client),
  bulkAssign: (ids, assignedTo) => apiClient.patch('/leads/bulk-assign', { ids, assignedTo: assignedTo || null }).then((r) => r.data),
};

// Full set the backend still accepts — kept so existing leads (and the
// convert flow, which sets 'won') keep rendering. `won`/`lost` are reachable
// via the Convert button, not the manual dropdown.
export const LEAD_STATUSES = [
  'new', 'contacted', 'callback', 'qualified', 'proposal', 'negotiation',
  'no_answer', 'not_interested', 'won', 'lost',
];

// The trimmed pipeline shown to staff: Fresh → Interested → Proposal → Negotiation.
export const SELECTABLE_LEAD_STATUSES = ['new', 'qualified', 'proposal', 'negotiation'];

export const LEAD_SOURCES = ['referral', 'website', 'social_media', 'walk_in', 'cold_call', 'advertisement', 'other'];

export const LEAD_STATUS_TONES = {
  new: 'neutral',
  contacted: 'primary',
  callback: 'warning',
  qualified: 'primary',
  proposal: 'warning',
  negotiation: 'warning',
  no_answer: 'neutral',
  not_interested: 'danger',
  won: 'success',
  lost: 'danger',
};
