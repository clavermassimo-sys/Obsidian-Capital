/* ============================================================
   Obsidian Capital — Axios API Instance
   Centralized HTTP client with JWT auth and 401 handling
   ============================================================ */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor: attach JWT token ─────────────────────

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('oc_user');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Malformed storage — ignore
    }
  }
  return config;
});

// ── Response Interceptor: handle 401 by clearing auth ────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('oc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
