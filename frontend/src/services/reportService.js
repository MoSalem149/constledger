import { api } from './api';

export const reportService = {
  allContracts: (params) => api.get('/reports/contracts', { params }).then((r) => r.data),
  monthly: (params) => api.get('/reports/monthly', { params }).then((r) => r.data),
  quarterly: (params) => api.get('/reports/quarterly', { params }).then((r) => r.data),
  projectPerformance: (id, params) =>
    api.get(`/reports/performance/${id}`, { params }).then((r) => r.data),
  penalties: (params) => api.get('/reports/penalties', { params }).then((r) => r.data),
  exportPdf: (type, params) =>
    api
      .get(`/reports/export/pdf/${type}`, { params, responseType: 'blob' })
      .then((r) => r.data),
  exportExcel: (type, params) =>
    api
      .get(`/reports/export/excel/${type}`, { params, responseType: 'blob' })
      .then((r) => r.data),
};
