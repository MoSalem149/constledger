import { api } from './api';

export const contractService = {
  list: (params) => api.get('/contracts', { params }).then((r) => r.data),
  get: (id) => api.get(`/contracts/${id}`).then((r) => r.data),
  upload: (formData) =>
    api
      .post('/contracts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  update: (id, data) => api.put(`/contracts/${id}`, data).then((r) => r.data),
  reanalyze: (id) => api.post(`/contracts/${id}/analyze`).then((r) => r.data),
  timeline: (id) => api.get(`/contracts/${id}/timeline`).then((r) => r.data),
};
