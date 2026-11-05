import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { MedicalRecord } from '../../types/patient';
import { Badge } from '../ui/Badge';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { MedicalStatusBadge } from '../ui/MedicalStatusBadge';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';

export function RecordCard({ record }: { record: MedicalRecord }) {
  return (
    <Link
      to={paths.app.record(record.id)}
      className="group block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-brand-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">{record.category}</p>
          <h3 className="mt-1 font-semibold text-ink-900 group-hover:text-brand-900 transition-colors">{record.title}</h3>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-400 group-hover:text-brand-600 transition-colors" />
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-500">{record.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {record.source === 'verified' ? <VerifiedBadge label="Provider-issued" /> : <Badge tone="slate">{record.source === 'uploaded' ? 'Patient-uploaded' : 'Source not recorded'}</Badge>}
        <MedicalStatusBadge status={record.status === 'pending' ? 'pending' : record.status === 'released' ? 'monitoring' : 'verified'} />
        <span className="text-xs text-ink-400">{formatDate(record.date)}</span>
      </div>
    </Link>
  );
}
