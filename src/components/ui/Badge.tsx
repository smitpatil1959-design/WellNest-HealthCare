import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type BadgeTone = 'brand' | 'emerald' | 'sky' | 'amber' | 'rose' | 'slate';

const tones: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-800 ring-brand-200/70',
  emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70',
  sky: 'bg-sky-50 text-sky-800 ring-sky-200/70',
  amber: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  rose: 'bg-rose-50 text-rose-800 ring-rose-200/70',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200/80',
};

export function Badge({
  tone = 'brand',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
