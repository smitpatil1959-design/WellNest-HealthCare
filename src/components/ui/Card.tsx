import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export function Card({
  className,
  padded = true,
  hover = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { padded?: boolean; hover?: boolean }) {
  return (
    <div
      className={cn(
        'workspace-card rounded-2xl border border-slate-200/80 bg-white shadow-xs',
        padded && 'p-5 sm:p-6',
        hover && 'lift',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-ink-900 sm:text-lg">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
