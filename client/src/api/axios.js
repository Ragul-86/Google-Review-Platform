import axios from 'axios';
import { getTokens, clearTokens, currentPrefix } from '@/lib/authStorage';

const API = axios.create({
  // In production (Vercel), VITE_API_URL points to Render backend.
  // In development, Vite proxy forwards /api → localhost:5001.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token scoped to the current area
// (/admin vs /client), so an admin tab and a client tab open at the same
// time in the same browser never send each other's tokens.
API.interceptors.request.use(
  (config) => {
    const { accessToken } = getTokens();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const prefix = currentPrefix();
      const { refreshToken } = getTokens(prefix);
      if (!refreshToken) {
        isRefreshing = false;
        clearTokens(prefix);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // IMPORTANT: build the refresh URL off API's own baseURL, not a bare
        // relative path. A relative "/api/auth/refresh" resolves against the
        // *frontend's* origin (Vercel) in production instead of the Render
        // backend, which 404s on every refresh and was silently logging
        // everyone out ~15 min into every session (the access token's TTL) —
        // regardless of activity.
        const { data } = await axios.post(`${API.defaults.baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem(`accessToken_${prefix}`, data.accessToken);
        localStorage.setItem(`refreshToken_${prefix}`, data.refreshToken);
        API.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens(prefix);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
