import type { MedicalStatus } from '../../types';
import { cn } from '../../utils/cn';

const map: Record<MedicalStatus, { label: string; className: string }> = {
  stable: { label: 'Stable', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80' },
  monitoring: { label: 'Monitoring', className: 'bg-sky-50 text-sky-800 ring-sky-200/80' },
  critical: { label: 'Critical', className: 'bg-rose-50 text-rose-800 ring-rose-200/80' },
  recovered: { label: 'Recovered', className: 'bg-brand-50 text-brand-800 ring-brand-200/80' },
  pending: { label: 'Pending review', className: 'bg-amber-50 text-amber-900 ring-amber-200/80' },
  verified: { label: 'Verified', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80' },
};

export function MedicalStatusBadge({ status, className }: { status: MedicalStatus; className?: string }) {
  const item = map[status] || { label: status, className: 'bg-slate-100 text-slate-800 ring-slate-200' };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', item.className, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {item.label}
    </span>
  );
}
