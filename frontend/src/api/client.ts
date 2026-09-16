import axios from 'axios';

// We use relative /api because Vercel routes /api to the backend in prod.
// Locally, Vite's dev server will proxy /api to http://localhost:8000.
const API_URL = import.meta.env.VITE_API_URL || '/api/';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Generic interceptor for catching 401s globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and reload to force login screen
      localStorage.removeItem('token');
      // Avoiding window.location.reload() loop if already on login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
