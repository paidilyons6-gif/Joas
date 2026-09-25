import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="loading-screen" style={{ padding: "2rem", textAlign: "center" }}>
          <h1 style={{ fontFamily: "DM Sans, sans-serif", marginBottom: "0.75rem" }}>
            Something broke
          </h1>
          <p style={{ marginBottom: "1rem", color: "#4a4a4a" }}>
            Refresh the page. If it keeps happening, tell Becca which screen you were on.
          </p>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => window.location.assign("/")}
          >
            Go home →
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
