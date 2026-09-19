// @vitest-environment jsdom
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: () => null,
    setItem: () => null,
  },
  writable: true
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AddExpenseModal from './AddExpenseModal';
import { useUIStore } from '../../store/uiStore';
import { apiClient } from '../../api/client';

// Mock the API client
vi.mock('../../api/client', () => ({
  apiClient: {
    post: vi.fn(),
  }
}));

const mockGroup = {
  id: 'test-group',
  name: 'Test Group',
  invite_code: '123456',
  simplified_debts: [],
  members: [
    { id: '1', name: 'Alice', user_id: 'u1', balance: 0, color: '#000000' },
    { id: '2', name: 'Bob', user_id: 'u2', balance: 0, color: '#000000' },
    { id: '3', name: 'Charlie', user_id: 'u3', balance: 0, color: '#000000' }
  ]
};

describe('Optimistic Math UI Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    // Prime the cache
    queryClient.setQueryData(['group', 'test-group'], mockGroup);
    queryClient.setQueryData(['group-activity', 'test-group'], []);
    
    // Open the modal
    useUIStore.setState({ isAddExpenseOpen: true });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/group/test-group']}>
          <Routes>
            <Route path="/group/:id" element={<AddExpenseModal group={mockGroup} />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('accurately calculates optimistic remainder distribution on 100/3 split', async () => {
    renderComponent();
    
    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText("Dinner at Joe's"), { target: { value: 'Dinner' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } });
    
    // Mock the API to delay so we can inspect optimistic state
    let resolveApi: any;
    const apiPromise = new Promise(resolve => { resolveApi = resolve; });
    vi.mocked(apiClient.post).mockReturnValueOnce(apiPromise as any);
    
    // Submit
    fireEvent.click(screen.getByText('Save'));
    
    // Wait for the cache to update optimistically
    await waitFor(() => {
      const groupCache = queryClient.getQueryData<any>(['group', 'test-group']);
      expect(groupCache.members[0].balance).not.toBe(0); // Alice paid, should change
    });
    
    const optimisticGroup = queryClient.getQueryData<any>(['group', 'test-group']);
    
    // Alice paid 100.
    // 100 / 3 = 33.33 each. 
    // Remainder = 100 - 99.99 = 0.01. 
    // Alice gets the 0.01 remainder, so her share is 33.34.
    // Bob and Charlie are 33.33.
    // Alice paid 100, her share is 33.34, net balance = 100 - 33.34 = +66.66
    // Bob net balance = -33.33
    // Charlie net balance = -33.33
    
    expect(optimisticGroup.members.find((m: any) => m.name === 'Alice').balance).toBe('66.66');
    expect(optimisticGroup.members.find((m: any) => m.name === 'Bob').balance).toBe('-33.33');
    expect(optimisticGroup.members.find((m: any) => m.name === 'Charlie').balance).toBe('-33.33');
    
    // Also verify the fake splits
    const activities = queryClient.getQueryData<any>(['group-activity', 'test-group']);
    const splits = activities[0].splits;
    expect(splits.find((s: any) => s.name === 'Alice').share_amount).toBe('33.34');
    expect(splits.find((s: any) => s.name === 'Bob').share_amount).toBe('33.33');
    
    // Resolve the promise to clean up
    resolveApi({ data: { ok: true } });
  });

  it('rolls back completely if the API request fails', async () => {
    renderComponent();
    
    fireEvent.change(screen.getByPlaceholderText("Dinner at Joe's"), { target: { value: 'Dinner' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } });
    
    // Mock the API to fail immediately
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network Error'));
    
    // Submit
    fireEvent.click(screen.getByText('Save'));
    
    // Wait for the rollback
    await waitFor(() => {
      const groupCache = queryClient.getQueryData<any>(['group', 'test-group']);
      // Should be rolled back to 0.00
      expect(groupCache.members[0].balance).toBe(0);
    });
    
    const activities = queryClient.getQueryData<any>(['group-activity', 'test-group']);
    expect(activities).toEqual([]); // Activity should be rolled back
  });
});
