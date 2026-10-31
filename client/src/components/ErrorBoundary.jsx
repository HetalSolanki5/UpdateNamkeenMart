import React from 'react';

/**
 * Global ErrorBoundary
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a graceful fallback UI instead of crashing the whole tree.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Render Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FDECEC] text-[#C62828] flex items-center justify-center mx-auto text-2xl font-black">
              ⚠️
            </div>
            <h1 className="text-xl font-black text-gray-900">Something went wrong</h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              An unexpected error occurred while rendering this page. Please refresh the page or return to safety.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#C62828] text-white text-xs font-bold hover:bg-[#8E1B1B] transition shadow-xs"
              >
                Refresh Page
              </button>
              <a
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
