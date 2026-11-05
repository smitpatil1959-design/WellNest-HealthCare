import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export function Table({
  columns,
  rows,
  caption,
  striped = false,
  compact = false,
  className,
}: {
  columns: string[];
  rows: ReactNode[][];
  caption?: string;
  striped?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <>
      <div className={cn("hidden overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs md:block", className)}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <thead className="border-b border-slate-200 bg-slate-50/90 text-ink-500">
              <tr>
                {columns.map((column) => (
                  <th key={column} className={cn("px-4 font-semibold uppercase tracking-wider text-ink-600 text-[11px]", compact ? "py-2.5" : "py-3")}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-ink-800">
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    "transition-colors hover:bg-slate-50/80",
                    striped && index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                  )}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        "px-4 align-middle text-sm",
                        compact ? "py-2.5" : "py-3.5"
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((row, index) => (
          <article key={index} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} className="flex items-start justify-between gap-3 py-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">{columns[cellIndex]}</span>
                <span className="text-right text-ink-800">{cell}</span>
              </div>
            ))}
          </article>
        ))}
      </div>
    </>
  );
}

export function TableEmpty({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-4 py-12 text-center text-sm text-ink-500', className)}>{children}</div>;
}
