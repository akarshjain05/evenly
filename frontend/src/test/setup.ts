import '@testing-library/react';

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: () => null,
    setItem: () => null,
  },
  writable: true
});
