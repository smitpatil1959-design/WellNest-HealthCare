import { useState } from 'react';
import { signInWithGoogle } from '../../lib/googleAuth';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

interface GoogleButtonProps {
  label?: string;
  returnTo?: string;
  onError?: (message: string) => void;
}

export function GoogleButton({
  label = 'Continue with Google',
  returnTo,
  onError,
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle(returnTo);
    } catch (err: unknown) {
      setLoading(false);

      const msg =
        err instanceof Error
          ? err.message
          : 'Could not initiate Google sign-in.';

      if (onError) {
        onError(msg);
      } else {
        setError(msg);
      }
    }
  };

  const googleIcon = (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.4c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.7Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1-.7-2.5-1.2-4.1-1.2-3.2 0-5.9-2.1-6.8-5H1.2v3.1C3.2 21.3 3.2 21.3 3.2 21.3Z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.2C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.1 15.2 0 12 0 7.3 0 3.2 2.7 1.2 6.6l4 3.1C6.1 6.9 8.8 4.8 12 4.8Z"
      />
    </svg>
  );

  return (
    <>
    <Button
      type="button"
      variant="outline"
      size="lg"
      fullWidth
      loading={loading}
      leftIcon={googleIcon}
      onClick={handleClick}
      className="border-line bg-white text-ink-800 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 [&>span]:flex [&>span]:items-center [&>span]:gap-2.5"
    >
      <span className="whitespace-nowrap font-medium text-[15px]">
        {label}
      </span>
    </Button>
    {error && <Alert tone="error" title="Google sign-in unavailable" className="mt-3">{error}</Alert>}
    </>
  );
}
