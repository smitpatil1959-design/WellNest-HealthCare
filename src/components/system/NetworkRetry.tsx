import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export function NetworkRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="space-y-4">
      <Alert tone="error" title="Could not complete that request">
        {message}
      </Alert>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
