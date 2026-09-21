import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './client';
import { setAuthStatus } from '../utils/auth';

vi.mock('../utils/auth', () => ({
  setAuthStatus: vi.fn(),
}));

describe('apiClient Network and Offline Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps Network Error to a user-friendly offline message', async () => {
    // Manually trigger the error interceptor logic with a mock Network Error payload
    const networkError = new Error('Network Error') as any;
    
    // Simulate axios feeding the error into the interceptor array
    const interceptor = (apiClient.interceptors.response as any).handlers[0].rejected;
    
    try {
      await interceptor(networkError);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response.data.userMessage).toBe('Unable to reach the server. Please check your internet connection.');
    }
  });

  it('intercepts Vercel SPA HTML fallbacks and throws 500 API Route Not Found', async () => {
    const htmlResponse = {
      response: {
        status: 200,
        data: '<html><body>Not Found</body></html>',
        headers: {
          'content-type': 'text/html; charset=utf-8'
        }
      }
    };
    
    const fulfilled = (apiClient.interceptors.response as any).handlers[0].fulfilled;
    
    try {
      await fulfilled(htmlResponse.response);
      expect.fail('Should have rejected the Promise');
    } catch (error: any) {
      expect(error.response.status).toBe(500);
      expect(error.response.data.detail).toBe('API route not found (returned HTML)');
    }
  });

  it('logs out user automatically on 401 Unauthorized', async () => {
    const unauthError = {
      response: {
        status: 401
      }
    };

    // Mock window.location
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, pathname: '/group/123', href: '' } as any;

    const interceptor = (apiClient.interceptors.response as any).handlers[0].rejected;

    try {
      await interceptor(unauthError);
    } catch (error) {
      // Expected to throw
    }

    expect(setAuthStatus).toHaveBeenCalledWith(false);
    expect(window.location.href).toBe('/login');

    // Restore
    window.location = originalLocation;
  });
});
