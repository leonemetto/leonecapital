import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
}

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[PageErrorBoundary:${this.props.pageName ?? 'unknown'}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', gap: 12, color: 'var(--ef-ink-3)',
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ef-ink)' }}>Something went wrong on this page.</p>
          <p style={{ fontSize: 13 }}>Try refreshing, or go back to the dashboard.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: 8, padding: '8px 20px', borderRadius: 20,
              background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)',
              fontSize: 13, fontWeight: 500, color: 'var(--ef-ink)', cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
