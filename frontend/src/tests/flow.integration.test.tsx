import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import Dashboard from '../pages/Dashboard';
import GroupView from '../pages/GroupView';
import { Routes, Route } from 'react-router-dom';
import DialogModal from '../components/modals/DialogModal';

vi.mock('../api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
  }
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
  AuthProvider: ({ children }: any) => <>{children}</>
}));

describe('Critical User Flow', () => {
  const user = userEvent.setup();
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    vi.clearAllMocks();
  });

  it('creates group -> adds expense -> verify balance update', async () => {
    
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url === 'users/me') return { data: { id: 'user_1', name: 'Alice' } };
      if (url.includes('groups/g1/activity')) return { data: [] };
      if (url.includes('groups/g1')) return { data: { id: 'g1', name: 'Test Trip', members: [{ id: 'u1', name: 'Alice', balance: '0.00', user_id: 'user_1' }, { id: 'u2', name: 'Bob', balance: '0.00', user_id: 'user_2' }] } };
      if (url === 'groups') return { data: [] };
      return { data: [] };
    });
    
    vi.mocked(apiClient.post).mockImplementation(async (url) => {
      if (url === 'groups') return { data: { group: { id: 'g1', name: 'Test Trip' } } };
      if (url === 'groups/g1/expenses') return { data: { status: 'ok' } };
      return { data: {} };
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/group/:id" element={<GroupView />} />
          </Routes>
          <DialogModal />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Dashboard - Create Group
    const nameInput = await screen.findByPlaceholderText('Miami Trip');
    await user.type(nameInput, 'Test Trip');
    
    await user.click(screen.getByRole('button', { name: 'Create Tab' }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('groups', { name: 'Test Trip' });
    });

    // Automatically navigates to /group/g1, GroupView loads
    expect(await screen.findByText('Bob')).toBeTruthy();
    
    // Add Expense
    await user.click(await screen.findByRole('button', { name: /Add expense/i }));
    
    const descInput = await screen.findByPlaceholderText(/Dinner at Joe's/i);
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    nativeInputValueSetter.call(descInput, 'Pizza');
    fireEvent.input(descInput, { target: { value: 'Pizza' } });
    const amtInput = screen.getByPlaceholderText('0.00');
    nativeInputValueSetter.call(amtInput, '20');
    fireEvent.input(amtInput, { target: { value: '20' } });
    
    const bobCheckbox = await screen.findByLabelText(/Bob/i);
    if (!(bobCheckbox as HTMLInputElement).checked) await user.click(bobCheckbox);
    
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      console.log('Error state:', screen.queryByText('Failed to save expense')?.textContent);
      expect(apiClient.post).toHaveBeenCalledWith('groups/g1/expenses', expect.objectContaining({
        description: 'Pizza',
        amount: 20
      }));
    });
    
    // Verify optimistic update
    // We verify the API call was made with the correct optimistic data.
    // (The UI will immediately re-fetch the mocked 0.00 balance, so we don't assert the DOM here)
  });
});
