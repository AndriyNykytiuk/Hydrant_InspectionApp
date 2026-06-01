import { api } from './client.js';

export const listBrigades = () => api.get('/brigades').then((r) => r.data);
export const createBrigade = (name) => api.post('/brigades', { name }).then((r) => r.data);
export const updateBrigade = (id, name) =>
  api.patch(`/brigades/${id}`, { name }).then((r) => r.data);
export const deleteBrigade = (id) => api.delete(`/brigades/${id}`).then((r) => r.data);
