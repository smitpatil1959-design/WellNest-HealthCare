import { BadgeCheck } from 'lucide-react';
import { cn } from '../../utils/cn';

export function VerifiedBadge({
  label = 'Verified issuer',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200/80',
        className,
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
      {label}
    </span>
  );
}
