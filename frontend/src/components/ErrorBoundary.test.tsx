import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test crash');
  }
  return <div>Safe Component</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe Component')).toBeTruthy();
  });

  it('catches error and displays fallback UI without raw technical details', () => {
    // Suppress console.error for the intentional throw
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText(/An unexpected error occurred/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Reload Page/i })).toBeTruthy();
    
    // Ensure raw technical details (from the old <details> block) are NOT shown
    expect(screen.queryByText('Error Details')).toBeNull();
    expect(screen.queryByText('Test crash')).toBeNull();
    
    consoleSpy.mockRestore();
  });
});
