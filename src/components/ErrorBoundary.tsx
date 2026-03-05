import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/** Простий Error Boundary: при помилці в дочірніх показує fallback замість падіння всього дерева. */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-gray-400">
            <p className="text-sm">Щось пішло не так.</p>
            <p className="text-xs">Оновіть сторінку або натисніть «Спробувати знову».</p>
            <button
              type="button"
              onClick={this.reset}
              className="mt-2 px-3 py-1.5 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 text-xs"
            >
              Спробувати знову
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
