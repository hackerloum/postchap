"use client";

import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Catches unhandled errors so the tab does not crash (e.g. mobile "Can't open page").
 * Shows a friendly fallback instead of blank screen.
 */
export class RootErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (typeof console !== "undefined") {
      console.error("[ErrorBoundary]", error, errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#080808",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "-apple-system, sans-serif",
          }}
          role="alert"
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: "#1A1A1A",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              fontSize: 24,
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              color: "#F2F2F2",
              fontSize: 18,
              fontWeight: 600,
              margin: "0 0 8px",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: "#888",
              fontSize: 13,
              textAlign: "center",
              margin: "0 0 24px",
            }}
          >
            Please refresh the page to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: "#E8FF47",
              color: "#080808",
              border: "none",
              padding: "10px 24px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh page
          </button>
          {typeof process !== "undefined" &&
            process.env.NODE_ENV === "development" &&
            this.state.error?.message && (
              <pre
                style={{
                  marginTop: 24,
                  color: "#FF4D4D",
                  fontSize: 11,
                  maxWidth: 320,
                  overflow: "auto",
                }}
              >
                {this.state.error.message}
              </pre>
            )}
        </div>
      );
    }
    return this.props.children;
  }
}
