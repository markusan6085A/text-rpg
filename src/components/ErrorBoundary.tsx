import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
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

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-gray-400">
            <p className="text-sm">Щось пішло не так.</p>
            <p className="text-xs">Оновіть сторінку або поверніться на головну.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
