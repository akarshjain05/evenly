import { setAuthStatus } from '../utils/auth';
import axios from 'axios';

// We use relative /api because Vercel routes /api to the backend in prod.
// Locally, Vite's dev server will proxy /api to http://localhost:8000.
const API_URL = import.meta.env.VITE_API_URL || '/api/';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Attach CSRF token to all state-mutating requests
apiClient.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfToken = getCookie('csrf_token');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});

// Generic interceptor for catching 401s globally and retrying legacy CSRF failures
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Auto-retry once if a legacy session encounters a missing CSRF token
    if (error.response?.status === 403 && error.response?.data?.detail === "CSRF token validation failed" && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // This GET request will trigger the backend to seamlessly issue a new CSRF cookie
        await apiClient.get('/users/me');
        // Retry the original request (the request interceptor will pull the newly minted cookie)
        return apiClient(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    if (error.response?.status === 401) {

      setAuthStatus(false);
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
