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

// Generic interceptor for catching 401s globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('is_logged_in');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
