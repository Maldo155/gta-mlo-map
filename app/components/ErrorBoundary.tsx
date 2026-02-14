"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            padding: 24,
            background: "#0f172a",
            color: "#e2e8f0",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20 }}>
            Please refresh the page to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              background: "#22d3ee",
              color: "#0f172a",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
