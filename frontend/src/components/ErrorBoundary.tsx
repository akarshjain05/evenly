import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-4 text-center">
          <div className="bg-paper p-8 rounded-2xl shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-danger mb-4">Something went wrong</h2>
            <p className="text-ink-soft mb-6">
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
            >
              Reload Page
            </button>
            
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
