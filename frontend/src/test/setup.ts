import { vi } from 'vitest';
import '@testing-library/react';

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: () => null,
    setItem: () => null,
  },
  writable: true
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
import 'fake-indexeddb/auto';
