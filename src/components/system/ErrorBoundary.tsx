import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('WellNest UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Container className="flex min-h-screen flex-col items-center justify-center py-20 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-600">Recovered</p>
        <h1 className="mt-4 max-w-xl font-display text-4xl text-ink-900">Something interrupted the interface.</h1>
        <p className="mt-4 max-w-md text-ink-500">
          No clinical data was involved. You can reload the page or return to the homepage.
        </p>
        <img src="/images/illustration-security.png" alt="" className="my-8 h-32 w-32 object-contain" />
        <Alert tone="error" title="Details" className="max-w-lg text-left">
          {this.state.error.message}
        </Alert>
        <div className="mt-8 flex gap-3">
          <Button onClick={() => this.setState({ error: null })}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go home
          </Button>
        </div>
      </Container>
    );
  }
}
