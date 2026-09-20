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

    // Generic error message sanitizer for UI consumption (preventing internal code leaks)
    if (error.response?.data?.detail) {
      const d = error.response.data.detail;
      if (typeof d === 'string') {
        const lower = d.toLowerCase();
        if (lower.includes('csrf')) {
          error.response.data.userMessage = "A secure connection error occurred. Please refresh the page and try again.";
        } else if (lower.includes('internal server error')) {
          error.response.data.userMessage = "Our servers are experiencing a temporary issue. Please try again later.";
        } else if ((lower.includes('validation') || lower.includes('type error')) && !lower.includes('email') && !lower.includes('password')) {
          error.response.data.userMessage = "Invalid data provided. Please check your inputs.";
        } else if (lower.includes('sqlite') || lower.includes('database') || lower.includes('unreachable')) {
          error.response.data.userMessage = "A system error occurred. Please try again.";
        } else {
          error.response.data.userMessage = d;
        }
      } else if (Array.isArray(d)) {
        error.response.data.userMessage = "Invalid data provided. Please check your inputs.";
      }
    } else if (error.message === "Network Error" || !error.response) {
       error.response = { 
           ...(error.response || {}), 
           data: { detail: error.response?.data?.detail, userMessage: "Unable to reach the server. Please check your internet connection." } 
       };
    }

    return Promise.reject(error);

  }
);
