import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

const styles = {
  info: {
    wrap: 'bg-brand-50/70 border-brand-200/80 text-brand-950',
    icon: Info,
    iconColor: 'text-brand-700',
  },
  success: {
    wrap: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950',
    icon: CheckCircle2,
    iconColor: 'text-emerald-700',
  },
  warning: {
    wrap: 'bg-amber-50/80 border-amber-200/80 text-amber-950',
    icon: AlertTriangle,
    iconColor: 'text-amber-700',
  },
  error: {
    wrap: 'bg-rose-50/70 border-rose-200/80 text-rose-950',
    icon: XCircle,
    iconColor: 'text-rose-600',
  },
} satisfies Record<string, { wrap: string; icon: LucideIcon; iconColor: string }>;

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof styles;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const config = styles[tone];
  const Icon = config.icon;
  return (
    <div className={cn('flex gap-3 rounded-xl border px-4 py-3 shadow-xs', config.wrap, className)} role="alert">
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconColor)} />
      <div className="flex-1 text-sm leading-relaxed">
        {title ? <p className="font-semibold text-ink-900">{title}</p> : null}
        {children ? <div className={cn('text-ink-700', title && 'mt-1')}>{children}</div> : null}
      </div>
    </div>
  );
}
