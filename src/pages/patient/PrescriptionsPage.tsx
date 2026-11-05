import { Pill, RotateCcw, Calendar, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { formatDate } from '../../utils/format';

interface Prescription {
  id: string;
  medicine: string;
  dosage: string;
  duration: string;
  instructions: string;
  refills_left: number;
  active: boolean;
  issued: string;
  doctor_id: string | null;
}

export default function PrescriptionsPage() {
  const query = useAuthenticatedApi<Prescription[]>('/api/prescriptions');
  const rows = query.data ?? [];

  const activeCount = rows.filter((r) => r.active).length;
  const totalRefills = rows.filter((r) => r.active).reduce((sum, r) => sum + (r.refills_left ?? 0), 0);

  return (
    <>
      <Seo title="Prescriptions" description="Active and historical medication orders." />
      <PatientPageHeader
        eyebrow="Pharmacy & Clinical Orders"
        title="Prescriptions"
        description="Prescriptions signed by your licensed care providers and synchronized directly with your WellNest patient profile."
      />

      {/* Metrics Stat Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Active Prescriptions</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Refills Remaining</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{totalRefills}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Total Prescription History</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{rows.length}</p>
        </div>
      </div>

      <AuthenticatedApiState loading={query.isLoading} error={query.error} retry={() => { void query.refetch(); }}>
        {rows.length === 0 ? (
          <EmptyState
            title="No prescriptions on file"
            description="Prescriptions issued by your doctor or hospital will appear here automatically."
            icon={Pill}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((row) => (
              <Card key={row.id} className="relative overflow-hidden transition-all hover:border-brand-300 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-brand-700 border border-teal-100">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-ink-900">{row.medicine}</h2>
                      <p className="text-xs font-semibold text-brand-700">
                        {row.dosage} {row.duration ? `· ${row.duration}` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge tone={row.active ? 'emerald' : 'slate'}>
                    {row.active ? 'Active Rx' : 'Completed'}
                  </Badge>
                </div>

                {row.instructions ? (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/90 p-3">
                    <p className="flex items-start gap-2 text-xs text-ink-700">
                      <FileText className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                      <span>{row.instructions}</span>
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-ink-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-ink-400" />
                    Issued {formatDate(row.issued)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-ink-700">
                    <RotateCcw className="h-3 w-3 text-ink-400" />
                    {row.active ? `${row.refills_left} refills left` : 'Finished'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </AuthenticatedApiState>
    </>
  );
}
