import { HospitalEntryForm } from '../../components/organization/HospitalEntryForm';
import { useState } from 'react';
import { Calendar, Clock, UserCheck, Stethoscope, Building2, CheckCircle2 } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppointmentCalendar } from '../../components/patient/AppointmentCalendar';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import type { ApptStatus } from '../../types/hospital';
import { cn } from '../../utils/cn';

const tabs: { id: ApptStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All Clinic Visits' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'waiting', label: 'Waiting / Triage' },
  { id: 'completed', label: 'Completed' },
  { id: 'canceled', label: 'Cancelled' },
];

export default function HospitalAppointmentsPage() {
  const { appointments, patients, doctors, depts, setApptStatus } = useHospitalPortal();
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('all');

  const rows = appointments.filter((a) => (tab === 'all' ? true : a.status === tab));

  const upcomingCount = appointments.filter((a) => a.status === 'upcoming').length;
  const waitingCount = appointments.filter((a) => a.status === 'waiting').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <>
      <Seo title="Campus Appointments" description="Hospital outpatient clinic schedule." />
      <PatientPageHeader
        eyebrow="Outpatient Operations"
        title="Campus appointments"
        description="Comprehensive outpatient clinic worklists, provider schedules, and reception check-in desk."
      />
      <HospitalEntryForm kind="appointments" />

      {/* Metrics Stat Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Total Scheduled</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{appointments.length}</p>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Upcoming Visits</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{upcomingCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-amber-800">In Waiting Room</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-amber-900">{waitingCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800">Completed Encounters</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-900">{completedCount}</p>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main Worklist Table (Left) */}
        <div className="min-w-0">
          {/* Pill Tabs */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                  tab === t.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="No appointments in this view"
              description="No clinic visits match the selected status filter."
              icon={Calendar}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    <tr>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Time & Date</th>
                      <th className="px-4 py-3">Physician & Wing</th>
                      <th className="px-4 py-3">Clinical Indication</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Triage Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-ink-800">
                    {rows.map((a) => {
                      const p = patients.find((x) => x.id === a.patientId);
                      const d = doctors.find((x) => x.id === a.doctorId);
                      const dep = depts.find((x) => x.id === a.departmentId);

                      return (
                        <tr key={a.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-4 py-3.5 align-middle">
                            <p className="font-semibold text-ink-900">{p?.name || 'Patient'}</p>
                            <p className="text-[11px] font-mono text-ink-400">MRN: {p?.mrn || '—'}</p>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-xs whitespace-nowrap">
                            <span className="font-semibold text-ink-900">{a.time}</span>
                            <span className="block text-[11px] text-ink-400">{a.date}</span>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-xs">
                            <p className="font-medium text-ink-900">{d?.name || 'Attending'}</p>
                            <p className="text-[11px] text-ink-500">{dep?.name || 'General Clinic'}</p>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-xs text-ink-600 max-w-xs truncate">
                            {a.reason || 'General Consultation'}
                          </td>
                          <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                            <Badge
                              tone={
                                a.status === 'completed'
                                  ? 'emerald'
                                  : a.status === 'waiting'
                                    ? 'amber'
                                    : a.status === 'upcoming'
                                      ? 'brand'
                                      : 'slate'
                              }
                              className="capitalize"
                            >
                              {a.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                            {a.status === 'upcoming' ? (
                              <Button
                                size="sm"
                                variant="soft"
                                onClick={() => setApptStatus(a.id, 'waiting')}
                              >
                                Check In
                              </Button>
                            ) : a.status === 'waiting' ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => setApptStatus(a.id, 'completed')}
                              >
                                Complete
                              </Button>
                            ) : (
                              <span className="text-xs text-ink-400">Archived</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Calendar Side Panel (Right) */}
        <div className="min-w-0 space-y-4">
          <AppointmentCalendar appointments={appointments} />
        </div>
      </div>
    </>
  );
}
