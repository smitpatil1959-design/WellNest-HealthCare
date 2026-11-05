import { useState } from 'react';
import { toAuthMessage } from '../utils/authErrors';

export function useAuthForm() {
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setServerError('');
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      setServerError(toAuthMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return { serverError, setServerError, busy, run };
}
