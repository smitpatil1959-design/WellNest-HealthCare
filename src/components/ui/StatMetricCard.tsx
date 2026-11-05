import type { ComponentType } from 'react';
import { cn } from '../../utils/cn';
import { Sparkline } from './Sparkline';

export function StatMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  points,
  className,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ComponentType<{ className?: string }>;
  points?: number[];
  className?: string;
}) {
  return (
    <article
      className={cn(
        'workspace-metric rounded-2xl border border-emerald-950/10 bg-white/90 p-4 transition-colors duration-200 sm:p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">{label}</p>
        {Icon ? (
          <span className="workspace-metric-icon flex h-9 w-9 items-center justify-center rounded-xl">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-4xl tracking-tight text-emerald-950">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-ink-500">{detail}</p> : null}
      {points?.length ? <Sparkline points={points} className="mt-3 h-8 w-full" color="#047857" /> : null}
    </article>
  );
}
