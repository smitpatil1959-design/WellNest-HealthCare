import type { ReactNode } from 'react';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

export function AuthenticatedApiState({ loading, error, retry, children }: {
  loading: boolean;
  error: unknown;
  retry: () => void;
  children: ReactNode;
}) {
  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (error) return <Alert tone="error" title="Could not load this information">
    <p>{error instanceof Error ? error.message : 'The server request failed.'}</p>
    <Button className="mt-3" size="sm" onClick={retry}>Retry</Button>
  </Alert>;
  return children;
}
