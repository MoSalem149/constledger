import api from './api';
import { normalizeId } from '../utils/normalizeId';

export const userService = {
  getUsers: (params = {}) =>
    api.get('/users', { params }).then((res) => res.data),

  createUser: (data) =>
    api.post('/users', data).then((res) => normalizeId(res.data)),

  getUserById: (id) =>
    api.get(`/users/${id}`).then((res) => normalizeId(res.data)),

  updateUser: (id, data) =>
    api.put(`/users/${id}`, data).then((res) => normalizeId(res.data)),

  deleteUser: (id) =>
    api.delete(`/users/${id}`).then((res) => res.data),
};
