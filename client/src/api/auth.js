import { api } from './client.js';

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const fetchMe = () => api.get('/auth/me').then((r) => r.data.user);

export const changePassword = (currentPassword, newPassword) =>
  api.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data);
