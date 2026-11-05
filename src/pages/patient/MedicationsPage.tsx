import { useState } from 'react';
import { Pill, CheckCircle2, Clock, AlertCircle, RotateCcw, Calendar, Check, ShieldCheck } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { useAuth } from '../../providers/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { safeApiFetch } from '../../utils/apiFetch';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
  taken_at: string | null;
}

export default function MedicationsPage() {
  const { session } = useAuth();
  const query = useAuthenticatedApi<Medication[]>('/api/medications');
  const [actionError, setActionError] = useState('');
  const [savingId, setSavingId] = useState('');
  const rows = query.data ?? [];

  const total = rows.length;
  const takenCount = rows.filter((r) => r.taken).length;
  const pendingCount = rows.filter((r) => !r.taken).length;
  const adherenceRate = total > 0 ? Math.round((takenCount / total) * 100) : 100;

  const toggleTaken = async (row: Medication) => {
    if (!session?.access_token) return setActionError('Your authenticated session is not ready.');
    setSavingId(row.id);
    setActionError('');
    const result = await safeApiFetch<Medication>('/api/medications', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, taken: !row.taken }),
    });
    if (!result.ok) setActionError(result.error);
    else await query.refetch();
    setSavingId('');
  };

  return (
    <>
      <Seo title="Medications Schedule" description="Daily medication schedule and dose adherence log." />
      <PatientPageHeader
        eyebrow="Treatment Plan"
        title="Medication schedule"
        description="Daily dosage tracking and adherence logging. Mark doses as taken to maintain your verified clinical record."
      />

      {/* Metric Cards Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Active Regimens</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{total}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800">Doses Taken</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-900">{takenCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-amber-800">Pending Doses</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-amber-900">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Today's Adherence</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{adherenceRate}%</p>
        </div>
      </div>

      {actionError ? (
        <Alert tone="error" title="Could not update dose" className="mb-4">
          {actionError}
        </Alert>
      ) : null}

      <AuthenticatedApiState loading={query.isLoading} error={query.error} retry={() => { void query.refetch(); }}>
        {rows.length === 0 ? (
          <EmptyState
            title="No medications on schedule"
            description="Medication entries will appear here when recorded in your treatment plan by your physician."
            icon={Pill}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Medication</th>
                    <th className="px-4 py-3">Dosage / Strength</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Adherence Status</th>
                    <th className="px-4 py-3">Last Logged</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-ink-800">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`transition-colors ${row.taken ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-slate-50/70'}`}
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                              row.taken
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-brand-100 bg-brand-50 text-brand-700'
                            }`}
                          >
                            <Pill className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">{row.name}</p>
                            <p className="text-[11px] text-ink-400">Oral Administration</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs font-semibold text-ink-700">
                        {row.dosage}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs font-medium text-ink-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-brand-600" />
                          <span>{row.time}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <Badge tone={row.taken ? 'emerald' : 'amber'}>
                          {row.taken ? 'Completed' : 'Pending Dose'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs text-ink-500 whitespace-nowrap">
                        {row.taken && row.taken_at
                          ? new Date(row.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={row.taken ? 'soft' : 'primary'}
                          loading={savingId === row.id}
                          onClick={() => { void toggleTaken(row); }}
                          leftIcon={row.taken ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                        >
                          {row.taken ? 'Undo Dose' : 'Mark Taken'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AuthenticatedApiState>
    </>
  );
}
