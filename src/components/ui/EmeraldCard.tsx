import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export function EmeraldCard({
  title,
  description,
  badge,
  action,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-emerald-950/10 bg-white/90 shadow-xl shadow-emerald-950/5 backdrop-blur-xl transition-all duration-300 hover:border-emerald-700/30',
        className,
      )}
      {...props}
    >
      {title || badge || action ? (
        <header className="flex items-start justify-between gap-4 border-b border-emerald-950/10 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {badge ? <div className="mb-2">{badge}</div> : null}
            {title ? <h2 className="font-display text-xl text-emerald-950">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-ink-500">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
