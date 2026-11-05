import { WifiOff } from 'lucide-react';
import { useOnline } from '../../hooks/useOnline';

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="fixed inset-x-0 top-[76px] z-[60] px-4" role="status">
      <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-md">
        <WifiOff className="h-4 w-4 shrink-0" />
        You are offline. Forms will retry when the connection returns.
      </div>
    </div>
  );
}
