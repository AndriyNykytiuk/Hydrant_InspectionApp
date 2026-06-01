import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';

export const api = axios.create({
  baseURL,
});

const TOKEN_KEY = 'hydrants_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      setToken(null);
      if (window.location.pathname !== '/login') {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
      }
    }
    return Promise.reject(err);
  }
);

export const extractError = (err) =>
  err?.response?.data?.error || err?.message || 'Невідома помилка';
