import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  action,
  illustration,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
  illustration?: string;
  icon?: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center sm:py-16">
      {Icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 text-slate-500 shadow-2xs">
          <Icon className="h-7 w-7 text-brand-600" />
        </div>
      ) : (
        <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 shadow-2xs">
          <img
            src={illustration || '/images/illustration-invite.png'}
            alt=""
            className="h-28 w-28 object-contain sm:h-32 sm:w-32"
          />
        </div>
      )}
      <h3 className="text-base font-semibold tracking-tight text-ink-900 sm:text-lg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>
      {action ?? (actionLabel && onAction ? (
        <Button className="mt-5" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null)}
      {children}
    </div>
  );
}
