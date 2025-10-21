import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = {
    hasError: false
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-trading-bg flex items-center justify-center">
          <div className="bg-trading-panel border border-trading-border rounded-lg p-8 max-w-md">
            <h2 className="text-xl font-semibold text-trading-text mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-400 mb-4">
              The application encountered an error. Please refresh the page to try again.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Error Details
                </summary>
                <pre className="text-xs text-red-400 mt-2 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-trading-green text-white px-4 py-2 rounded hover:bg-opacity-80 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
