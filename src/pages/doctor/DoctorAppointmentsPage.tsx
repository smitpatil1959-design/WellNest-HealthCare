import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  X,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { useAuth } from '../../providers/AuthProvider';
import { safeApiFetch } from '../../utils/apiFetch';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';
import { AvailabilityCalendar } from '../../components/doctor/AvailabilityCalendar';

interface AppointmentRow {
  id: string;
  grant_id: string | number | null;
  patient_name: string | null;
  title: string;
  reason: string;
  date: string;
  time: string;
  status: string;
}

interface GrantRow {
  id: string | number;
  patient_name: string;
  status: string;
}

const tabs = ['all', 'upcoming', 'in-progress', 'completed', 'canceled'] as const;

export default function DoctorAppointmentsPage() {
  const { session } = useAuth();
  const appointmentsQuery = useAuthenticatedApi<AppointmentRow[]>('/api/appointments');
  const grantsQuery = useAuthenticatedApi<GrantRow[]>('/api/access-grants');
  const [tab, setTab] = useState<(typeof tabs)[number]>('all');
  const [actionError, setActionError] = useState('');
  const [savingId, setSavingId] = useState('');

  const appointments = appointmentsQuery.data ?? [];
  const rows = useMemo(
    () => appointments.filter((item) => tab === 'all' || item.status === tab),
    [appointments, tab]
  );
  const activeGrants = new Map(
    (grantsQuery.data ?? [])
      .filter((grant) => grant.status === 'active')
      .map((grant) => [String(grant.id), grant])
  );

  const upcomingCount = appointments.filter((a) => a.status === 'upcoming').length;
  const inProgressCount = appointments.filter((a) => a.status === 'in-progress').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  const updateStatus = async (id: string, status: 'in-progress' | 'completed' | 'canceled') => {
    setActionError('');
    if (!session?.access_token) {
      setActionError('Your session is not ready. Sign in again.');
      return;
    }
    setSavingId(id);
    const result = await safeApiFetch<AppointmentRow>('/api/appointments', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setSavingId('');
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    await appointmentsQuery.refetch();
  };

  return (
    <>
      <Seo title="Doctor Schedule" description="Appointments assigned to your verified doctor account." />
      <PatientPageHeader
        eyebrow="Clinical Calendar"
        title="Consultation schedule"
        description="View patient visits and consultation status in your shared schedule. The calendar refreshes while this page is open."
      />

      {/* Metrics Stat Row */}
      <AvailabilityCalendar />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Total Encounters</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{appointments.length}</p>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Waiting / Upcoming</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{upcomingCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-amber-800">In Progress</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-amber-900">{inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800">Completed</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-900">{completedCount}</p>
        </div>
      </div>

      {actionError ? (
        <Alert tone="error" title="Appointment not updated" className="mb-4">
          {actionError}
        </Alert>
      ) : null}

      {appointmentsQuery.isError || grantsQuery.isError ? (
        <Alert tone="error" title="Schedule unavailable" className="mb-4">
          {appointmentsQuery.error?.message || grantsQuery.error?.message || 'Check your connection and retry.'}
        </Alert>
      ) : null}

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn(
              'shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition-all',
              tab === item
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50'
            )}
          >
            {item.replace('-', ' ')}
          </button>
        ))}
      </div>

      {appointmentsQuery.isLoading || grantsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : null}

      {!appointmentsQuery.isLoading && !appointmentsQuery.isError && rows.length === 0 ? (
        <EmptyState
          title="No appointments scheduled"
          description="Appointments requested for your verified doctor account will appear in this clinical schedule."
          icon={Calendar}
        />
      ) : null}

      {/* Structured Schedule List */}
      <div className="space-y-3">
        {rows.map((item) => {
          const grant = item.grant_id == null ? undefined : activeGrants.get(String(item.grant_id));
          const patientDisplayName = grant?.patient_name || item.patient_name || 'Patient';
          const initials = patientDisplayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <Card key={item.id} hover className="transition-all">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Time Slot on Left */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center rounded-xl border border-teal-100 bg-teal-50/60 px-3.5 py-2.5 text-center min-w-[75px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                      {formatDate(item.date)}
                    </span>
                    <span className="font-display text-base font-bold text-ink-900 mt-0.5">
                      {item.time || '—'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-ink-700">
                        {initials}
                      </div>
                      <h3 className="font-semibold text-ink-900 text-sm">
                        {patientDisplayName}
                      </h3>
                      {grant ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          <ShieldCheck className="h-2.5 w-2.5" /> Consented
                        </span>
                      ) : (
                        <span className="inline-flex text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Pending Consent
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs font-medium text-ink-600">
                      Visit type: <span className="text-ink-900 font-semibold">{item.title}</span>
                    </p>

                    {item.reason ? (
                      <p className="mt-1 text-xs text-ink-500 bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-xl">
                        <span className="font-semibold text-ink-700">Complaint: </span>
                        {item.reason}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Status & Action Controls */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
                  <Badge
                    tone={
                      item.status === 'completed'
                        ? 'emerald'
                        : item.status === 'in-progress'
                          ? 'brand'
                          : item.status === 'canceled'
                            ? 'rose'
                            : 'slate'
                    }
                    className="capitalize text-xs"
                  >
                    {item.status.replace('-', ' ')}
                  </Badge>

                  {item.status === 'upcoming' ? (
                    <Button
                      size="sm"
                      disabled={!grant || savingId === item.id}
                      onClick={() => void updateStatus(item.id, 'in-progress')}
                      leftIcon={<Play className="h-3 w-3" />}
                    >
                      Start
                    </Button>
                  ) : null}

                  {item.status === 'in-progress' ? (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={savingId === item.id}
                      onClick={() => void updateStatus(item.id, 'completed')}
                      leftIcon={<Check className="h-3 w-3" />}
                    >
                      Complete
                    </Button>
                  ) : null}

                  {item.status === 'upcoming' || item.status === 'in-progress' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={savingId === item.id}
                      onClick={() => void updateStatus(item.id, 'canceled')}
                    >
                      Cancel
                    </Button>
                  ) : null}

                  {grant ? (
                    <Button
                      size="sm"
                      variant="outline"
                      to={paths.app.doctorPatient(String(grant.id))}
                    >
                      Chart
                    </Button>
                  ) : (
                    <Link
                      className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                      to={paths.app.doctorWorkflow}
                    >
                      Request consent
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
