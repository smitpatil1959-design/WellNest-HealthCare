import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, X, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
}

interface ToastContextValue {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneIcon = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
} as const;

const toneClass = {
  success: 'text-emerald-600',
  info: 'text-brand-600',
  warning: 'text-amber-600',
  error: 'text-rose-600',
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 5200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-20 z-[80] flex w-[min(100%-2rem,380px)] flex-col gap-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = toneIcon[toast.tone ?? 'info'];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                className="pointer-events-auto flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-lg"
                role="status"
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', toneClass[toast.tone ?? 'info'])} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="rounded-lg p-1 text-ink-400 transition hover:bg-surface-muted hover:text-ink-700"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- provider hook shares its context module.
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
