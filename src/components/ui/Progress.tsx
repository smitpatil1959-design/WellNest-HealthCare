import { cn } from '../../utils/cn';
import { clamp } from '../../utils/format';

export function Progress({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const width = clamp(value, 0, 100);
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-ink-700">{label}</span>
          <span className="text-ink-500">{Math.round(width)}%</span>
        </div>
      ) : null}
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
