import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthPage from './AuthPage';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('AuthPage', () => {
  it('renders sign in by default', () => {
    renderWithProviders(<AuthPage />);
    expect(screen.getByText('Sign in to your account')).toBeTruthy();
    expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy();
  });

  it('toggles to register mode', () => {
    renderWithProviders(<AuthPage />);
    const registerTab = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(registerTab);
    
    expect(screen.getByText('Create a free account')).toBeTruthy();
    expect(screen.getByPlaceholderText('Alice')).toBeTruthy(); // Name field appears
    expect(screen.getAllByPlaceholderText('••••••••', { exact: false }).length).toBeGreaterThan(0);
  });

  it('shows password mismatch error during registration', async () => {
    renderWithProviders(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@test.com' } });
    
    // The password fields are selected by label
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'password456' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    
    expect(await screen.findByText('Passwords do not match')).toBeTruthy();
  });
});
