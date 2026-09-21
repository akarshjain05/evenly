import { setAuthStatus } from '../utils/auth';
import axios from 'axios';

// We use relative /api because Vercel routes /api to the backend in prod.
// Locally, Vite's dev server will proxy /api to http://localhost:8000.
const API_URL = import.meta.env.VITE_API_URL || "/api";

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
  (response) => {
    // Prevent Vercel SPA routing from silently returning 200 OK HTML pages for missing API routes
    if (typeof response.data === 'string' && response.headers['content-type']?.includes('text/html')) {
        return Promise.reject({ response: { status: 500, data: { detail: "API route not found (returned HTML)" } } });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Auto-retry once if a legacy session encounters a missing CSRF token
    if (error.response?.status === 403 && !originalRequest._retry && error.config?.method?.toUpperCase() !== "GET") {
      originalRequest._retry = true;
      try {
        // This GET request will trigger the backend to seamlessly issue a new CSRF cookie
        await apiClient.get('/auth/csrf');
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
      const status = error.response.status;
      if (typeof d === 'string') {
        if (status >= 500) {
          error.response.data.userMessage = "Our servers are experiencing a temporary issue. Please try again later.";
        } else if (status === 422) {
          error.response.data.userMessage = "Invalid data provided. Please check your inputs.";
        } else {
          error.response.data.userMessage = d;
        }
      } else if (Array.isArray(d) && d.length > 0) {
        try {
          const first = d[0];
          const field = first.loc ? first.loc[first.loc.length - 1] : null;
          const msg = first.msg;
          if (field && msg) {
            const cleanField = String(field).charAt(0).toUpperCase() + String(field).slice(1).replace(/_/g, ' ');
            error.response.data.userMessage = `${cleanField}: ${msg}`;
          } else if (msg) {
            error.response.data.userMessage = msg;
          } else {
            error.response.data.userMessage = "Invalid data provided. Please check your inputs.";
          }
        } catch(e) {
          error.response.data.userMessage = "Invalid data provided. Please check your inputs.";
        }
      }
    } else if (error.message === "Network Error" || !error.response) {
       error.response = { 
           ...(error.response || {}), 
           data: { detail: error.response?.data?.detail, userMessage: "Unable to reach the server. Please check your internet connection." } 
       };
    } else if (error.response.status >= 500) {
       // Catch 502 Bad Gateway or 500 Internal Server Error HTML pages from Vercel crashes
       if (typeof error.response.data !== 'object') {
           error.response.data = {};
       }
       error.response.data.userMessage = "Our servers are experiencing a temporary issue. Please try again later.";
    }

    return Promise.reject(error);

  }
);
