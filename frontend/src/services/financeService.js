import { api } from './api';

export const financeService = {
  getPlannedBudget: (contractId) => api.get(`/finance/planned/${contractId}`).then((r) => r.data),
  updatePlanned: (contractId, data) =>
    api.put(`/finance/planned/${contractId}`, data).then((r) => r.data),
  listReports: (params) => api.get('/finance/actual', { params }).then((r) => r.data),
  submitReport: (data) => api.post('/finance/actual', data).then((r) => r.data),
  approveReport: (id) => api.put(`/finance/actual/${id}/approve`).then((r) => r.data),
  rejectReport: (id, reason) =>
    api.put(`/finance/actual/${id}/reject`, { reason }).then((r) => r.data),
};
