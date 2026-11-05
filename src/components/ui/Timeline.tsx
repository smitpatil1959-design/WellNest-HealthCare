import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface TimelineItem {
  title: string;
  meta?: string;
  body?: string;
  icon?: ReactNode;
  tone?: 'brand' | 'emerald' | 'sky';
}

const dotTones = {
  brand: 'bg-brand-600 ring-brand-100',
  emerald: 'bg-emerald-600 ring-emerald-100',
  sky: 'bg-sky-500 ring-sky-100',
};

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn('relative space-y-4', className)}>
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="relative pl-7">
          {index !== items.length - 1 ? (
            <span className="absolute left-[7px] top-4.5 h-[calc(100%+8px)] w-px bg-slate-200/90" aria-hidden />
          ) : null}
          <span
            className={cn(
              'absolute left-0 top-2 h-3.5 w-3.5 rounded-full border-2 border-white ring-4 transition-all',
              dotTones[item.tone ?? 'brand'],
            )}
          />
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-ink-900">{item.title}</p>
              {item.meta ? (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{item.meta}</p>
              ) : null}
            </div>
            {item.body ? <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{item.body}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
