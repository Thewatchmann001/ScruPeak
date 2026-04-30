import React from 'react';
import { Link } from 'react-router-dom';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12">
          <div className="max-w-lg w-full bg-white shadow-lg rounded-3xl border border-gray-200 p-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred while loading the application.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                className="px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark"
                onClick={this.handleReload}
              >
                Reload page
              </button>
              <Link
                to="/"
                className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Go to home
              </Link>
            </div>
            {this.state.error ? (
              <pre className="mt-6 overflow-x-auto text-left text-xs text-gray-500 bg-gray-100 p-4 rounded-lg">
                {this.state.error.message}
              </pre>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
