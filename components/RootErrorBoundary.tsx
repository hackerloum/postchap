"use client";

import React from "react";

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: Error };

/**
 * Catches unhandled errors so the tab does not crash (e.g. on mobile Chrome).
 * Shows a friendly fallback instead of "Restart Chrome" / blank screen.
 */
export class RootErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (typeof console !== "undefined") {
      console.error("[RootErrorBoundary]", error, errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-base text-text-primary font-apple"
          role="alert"
        >
          <p className="text-center text-text-secondary mb-4">
            Something went wrong loading the app.
          </p>
          <p className="text-center text-sm text-text-muted mb-6 max-w-sm">
            Try refreshing the page. If it keeps happening, try opening in a private tab or another browser.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-bg-base text-sm font-medium"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
