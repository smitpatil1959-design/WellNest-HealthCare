import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Siren,
  Calendar,
  Pill,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  Stethoscope,
  ChevronRight,
  AlertCircle,
  FileBadge,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PortalHeroBanner } from '../../components/ui/PortalHeroBanner';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { useAuth } from '../../providers/AuthProvider';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import { fadeUp, stagger } from '../../animations/variants';

interface DashboardAppointment {
  id: string;
  title: string;
  doctor: string;
  hospital: string;
  date: string;
  time: string;
  status: string;
}

interface DashboardPrescription {
  id: string;
  medicine: string;
  dosage: string;
  issued: string;
  active: boolean;
}

interface DashboardRecord {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
}

interface DashboardMedication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
}

interface DashboardTimelineEvent {
  id: string;
  kind?: string;
  title: string;
  date: string | null;
  organization: string;
  detail?: string;
}

export default function PatientDashboardPage() {
  const { profile } = useAuth();
  const appointments = useAuthenticatedApi<DashboardAppointment[]>('/api/appointments');
  const prescriptions = useAuthenticatedApi<DashboardPrescription[]>('/api/prescriptions');
  const records = useAuthenticatedApi<DashboardRecord[]>('/api/records');
  const medications = useAuthenticatedApi<DashboardMedication[]>('/api/medications');
  const timeline = useAuthenticatedApi<DashboardTimelineEvent[]>('/api/timeline');

  const firstName = profile?.fullName?.split(' ')[0] || profile?.email?.split('@')[0] || 'there';
  const upcomingAppointments = (appointments.data ?? []).filter((row) => row.status === 'upcoming');
  const nextVisit = upcomingAppointments.sort((a, b) => a.date.localeCompare(b.date))[0];
  const activePrescriptions = (prescriptions.data ?? []).filter((row) => row.active);
  const latestPrescription = prescriptions.data?.[0];
  const latestRecord = records.data?.[0];
  const medList = medications.data ?? [];
  const takenCount = medList.filter((m) => m.taken).length;
  const remainingDoses = medList.filter((m) => !m.taken).length;
  const failed = [appointments, prescriptions, records, medications, timeline].filter((q) => q.isError).length;

  return (
    <>
      <Seo title="Patient Dashboard" description="Your universal lifetime health dashboard on WellNest." />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Hero Section */}
        <motion.div variants={fadeUp}>
          <PortalHeroBanner
            roleLabel="Your personal care space"
            title={`Welcome back, ${firstName}.`}
            description="A little clarity for your day. Your health records, appointments, and care team — all together, right here."
            aside={profile?.bloodGroup ? (
              <Badge tone="rose">Blood Group: {profile.bloodGroup}</Badge>
            ) : undefined}
            actions={
              <>
                <Button to={paths.app.patientHealthId} size="sm" leftIcon={<FileBadge className="h-4 w-4" />}>
                  My Health ID
                </Button>
                <Button to={paths.app.patientAppointments} variant="outline" size="sm" leftIcon={<Calendar className="h-4 w-4" />}>
                  Book Visit
                </Button>
                <Button to={paths.app.patientEmergency} variant="danger" size="sm" leftIcon={<Siren className="h-4 w-4" />}>
                  Emergency Card
                </Button>
              </>
            }
          />
        </motion.div>

        {failed ? (
          <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-medium text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{failed} data query failed. Please refresh or verify network access.</span>
            </div>
          </div>
        ) : null}

        {/* Live Stat Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <StatCard
            label="Medical Records"
            value={records.data?.length}
            loading={records.isLoading}
            icon={FileText}
            tone="brand"
            subtext="Stored in your account"
          />
          <StatCard
            label="Active Rx"
            value={activePrescriptions.length}
            loading={prescriptions.isLoading}
            icon={Pill}
            tone="emerald"
            subtext={`${(prescriptions.data ?? []).length} total scripts`}
          />
          <StatCard
            label="Upcoming Visits"
            value={upcomingAppointments.length}
            loading={appointments.isLoading}
            icon={Calendar}
            tone="sky"
            subtext={nextVisit ? `Next: ${formatDate(nextVisit.date)}` : 'None scheduled'}
          />
          <StatCard
            label="Daily Meds Done"
            value={medList.length > 0 ? `${takenCount}/${medList.length}` : 0}
            loading={medications.isLoading}
            icon={Activity}
            tone="brand"
            subtext={remainingDoses === 0 && medList.length > 0 ? 'All doses completed!' : `${remainingDoses} doses left today`}
            progress={!medications.isLoading && !medications.isError && medList.length > 0
              ? (takenCount / medList.length) * 100
              : undefined}
          />
        </motion.div>

        {/* Quick Action Buttons Grid */}
        <motion.div variants={fadeUp} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            <Link
              to={paths.app.patientRecords}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 text-center transition-all hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-2xs group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-brand-700 group-hover:scale-105 transition-transform">
                <FileText className="h-4 w-4" />
              </div>
              <span className="mt-2 text-xs font-semibold text-ink-800">All Records</span>
            </Link>

            <Link
              to={paths.app.patientAppointments}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 text-center transition-all hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-2xs group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 group-hover:scale-105 transition-transform">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="mt-2 text-xs font-semibold text-ink-800">Appointments</span>
            </Link>

            <Link
              to={paths.app.patientPrescriptions}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 text-center transition-all hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-2xs group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                <Pill className="h-4 w-4" />
              </div>
              <span className="mt-2 text-xs font-semibold text-ink-800">Prescriptions</span>
            </Link>

            <Link
              to={paths.app.patientMedications}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 text-center transition-all hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-2xs group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
                <Clock className="h-4 w-4" />
              </div>
              <span className="mt-2 text-xs font-semibold text-ink-800">Med Schedule</span>
            </Link>

            <Link
              to={paths.app.patientTimeline}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 text-center transition-all hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-2xs group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-105 transition-transform">
                <Activity className="h-4 w-4" />
              </div>
              <span className="mt-2 text-xs font-semibold text-ink-800">Care Timeline</span>
            </Link>

            <Link
              to={paths.app.patientEmergency}
              className="flex flex-col items-center justify-center rounded-xl border border-rose-200/70 bg-rose-50/40 p-3 text-center transition-all hover:border-rose-400 hover:bg-rose-50 hover:shadow-2xs group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 group-hover:scale-105 transition-transform">
                <Siren className="h-4 w-4" />
              </div>
              <span className="mt-2 text-xs font-semibold text-rose-800">Emergency</span>
            </Link>
          </div>
        </motion.div>

        {/* Main Content: Next Appointment & Today's Medications */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Upcoming Appointment */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-brand-700 border border-teal-100">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">Upcoming Visit</h2>
                  <p className="text-[11px] text-ink-500">Confirmed clinic consultations</p>
                </div>
              </div>
              <Link to={paths.app.patientAppointments} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all ({upcomingAppointments.length})
              </Link>
            </div>
            <AuthenticatedApiState loading={appointments.isLoading} error={appointments.error} retry={() => { void appointments.refetch(); }}>
              {nextVisit ? (
                <div className="rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50/50 to-slate-50/60 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-700">
                        <Stethoscope className="h-3 w-3" />
                        {nextVisit.title}
                      </span>
                      <p className="mt-1 font-semibold text-ink-900">{nextVisit.doctor}</p>
                      <p className="text-xs text-ink-500">{nextVisit.hospital || 'Location not listed'}</p>
                    </div>
                    <Badge tone="brand">Confirmed</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-teal-100/60 pt-3 text-xs">
                    <div className="flex items-center gap-2 font-medium text-brand-900">
                      <Clock className="h-3.5 w-3.5 text-brand-700" />
                      <span>{formatDate(nextVisit.date)}{nextVisit.time ? ` at ${nextVisit.time}` : ''}</span>
                    </div>
                    <Button to={paths.app.patientAppointments} size="sm" variant="outline">
                      Details
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No upcoming visits"
                  description="When a clinic or doctor books a consultation, it will appear here."
                  actionLabel="Request consultation"
                  onAction={() => window.location.assign(paths.app.patientAppointments)}
                />
              )}
            </AuthenticatedApiState>
          </Card>

          {/* Today's Medications (Checklist Display) */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">Today's Medication Adherence</h2>
                  <p className="text-[11px] text-ink-500">{remainingDoses === 0 && medList.length > 0 ? 'All doses taken today' : `${remainingDoses} doses pending today`}</p>
                </div>
              </div>
              <Link to={paths.app.patientMedications} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                Log doses
              </Link>
            </div>
            <AuthenticatedApiState loading={medications.isLoading} error={medications.error} retry={() => { void medications.refetch(); }}>
              {medList.length === 0 ? (
                <EmptyState
                  title="No active medications"
                  description="Prescribed medications will populate this daily adherence list automatically."
                />
              ) : (
                <div className="space-y-2.5">
                  {medList.slice(0, 4).map((med) => (
                    <div
                      key={med.id}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                        med.taken
                          ? 'border-emerald-200/80 bg-emerald-50/30'
                          : 'border-slate-200/80 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                            med.taken
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${med.taken ? 'text-ink-500 line-through' : 'text-ink-900'}`}>
                            {med.name}
                          </p>
                          <p className="text-[11px] text-ink-400">
                            {med.dosage} · Scheduled for {med.time}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          med.taken
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {med.taken ? 'Taken' : 'Pending'}
                      </span>
                    </div>
                  ))}
                  {medList.length > 4 ? (
                    <p className="pt-1 text-center text-xs text-ink-400">
                      +{medList.length - 4} more scheduled medications
                    </p>
                  ) : null}
                </div>
              )}
            </AuthenticatedApiState>
          </Card>
        </div>

        {/* Secondary Grid: Latest Records & Prescriptions */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Latest Medical Record */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-700" />
                <h2 className="text-sm font-semibold text-ink-900">Latest Clinical Report</h2>
              </div>
              <Link to={paths.app.patientRecords} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                All records ({records.data?.length ?? 0})
              </Link>
            </div>
            <AuthenticatedApiState loading={records.isLoading} error={records.error} retry={() => { void records.refetch(); }}>
              {latestRecord ? (
                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-600">
                        {latestRecord.category}
                      </span>
                      <p className="mt-1.5 font-semibold text-ink-900">{latestRecord.title}</p>
                      <p className="text-xs text-ink-500">Released {formatDate(latestRecord.date)}</p>
                    </div>
                    <Badge tone={latestRecord.status === 'released' || latestRecord.status === 'verified' ? 'emerald' : 'amber'}>
                      {latestRecord.status}
                    </Badge>
                  </div>
                  <div className="mt-3.5 flex items-center justify-end">
                    <Button size="sm" variant="outline" to={paths.app.record(latestRecord.id)}>
                      Open Report <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState title="No records yet" description="Laboratory results and clinical summaries will appear here." />
              )}
            </AuthenticatedApiState>
          </Card>

          {/* Latest Prescription */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-brand-700" />
                <h2 className="text-sm font-semibold text-ink-900">Latest Prescription</h2>
              </div>
              <Link to={paths.app.patientPrescriptions} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                All scripts ({prescriptions.data?.length ?? 0})
              </Link>
            </div>
            <AuthenticatedApiState loading={prescriptions.isLoading} error={prescriptions.error} retry={() => { void prescriptions.refetch(); }}>
              {latestPrescription ? (
                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-ink-900">{latestPrescription.medicine}</p>
                      <p className="mt-0.5 text-xs text-ink-500">Dosage: {latestPrescription.dosage}</p>
                      <p className="mt-1 text-[11px] text-ink-400">Issued: {formatDate(latestPrescription.issued)}</p>
                    </div>
                    <Badge tone={latestPrescription.active ? 'emerald' : 'slate'}>
                      {latestPrescription.active ? 'Active Rx' : 'Completed'}
                    </Badge>
                  </div>
                  <div className="mt-3.5 flex items-center justify-end">
                    <Button size="sm" variant="outline" to={paths.app.patientPrescriptions}>
                      View Script Details
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState title="No prescriptions" description="Medication orders signed by your physician will appear here." />
              )}
            </AuthenticatedApiState>
          </Card>
        </div>

        {/* Rich Care Timeline Feed */}
        <Card>
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-700" />
              <div>
                <h2 className="text-sm font-semibold text-ink-900">Recent Care Events & Chronology</h2>
                <p className="text-[11px] text-ink-500">Unified health timeline across all participating organizations</p>
              </div>
            </div>
            <Link to={paths.app.patientTimeline} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
              Full timeline <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <AuthenticatedApiState loading={timeline.isLoading} error={timeline.error} retry={() => { void timeline.refetch(); }}>
            {(timeline.data ?? []).length === 0 ? (
              <EmptyState title="No timeline entries" description="Your timeline populates as care events and lab tests occur." />
            ) : (
              <div className="divide-y divide-slate-100">
                {(timeline.data ?? []).slice(0, 5).map((event) => {
                  const isLab = event.kind === 'lab' || event.title.toLowerCase().includes('lab') || event.title.toLowerCase().includes('test');
                  const isRx = event.kind === 'rx' || event.title.toLowerCase().includes('prescription');
                  const isVisit = event.kind === 'visit' || event.title.toLowerCase().includes('appointment') || event.title.toLowerCase().includes('consult');

                  return (
                    <div key={event.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                            isLab
                              ? 'border-sky-200 bg-sky-50 text-sky-700'
                              : isRx
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : isVisit
                                  ? 'border-purple-200 bg-purple-50 text-purple-700'
                                  : 'border-brand-200 bg-brand-50 text-brand-700'
                          }`}
                        >
                          {isLab ? <Activity className="h-4 w-4" /> : isRx ? <Pill className="h-4 w-4" /> : isVisit ? <Calendar className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink-900">{event.title}</p>
                          <p className="text-[11px] text-ink-500">
                            {event.organization || 'Verified Healthcare Provider'}
                            {event.detail ? ` · ${event.detail}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-ink-400">
                        {formatDate(event.date ?? '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </AuthenticatedApiState>
        </Card>
      </motion.div>
    </>
  );
}

function StatCard({
  label,
  value,
  loading,
  icon: Icon,
  tone = 'brand',
  subtext,
  progress,
}: {
  label: string;
  value?: number | string;
  loading: boolean;
  icon?: typeof Activity;
  tone?: 'brand' | 'emerald' | 'sky';
  subtext?: string;
  progress?: number;
}) {
  const toneClasses = {
    brand: 'border-teal-100 bg-teal-50/50 text-brand-700',
    emerald: 'border-emerald-100 bg-emerald-50/50 text-emerald-700',
    sky: 'border-sky-100 bg-sky-50/50 text-sky-700',
  }[tone];

  return (
    <div className="workspace-metric rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-500">{label}</p>
        {progress !== undefined ? (
          <div
            className="relative flex h-9 w-9 items-center justify-center"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Today's medication adherence"
          >
            <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-100" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="94.25"
                strokeDashoffset={94.25 * (1 - Math.min(100, Math.max(0, progress)) / 100)}
                className="text-emerald-600 transition-[stroke-dashoffset] duration-500"
              />
            </svg>
            <span className="absolute text-[9px] font-bold text-emerald-800">{Math.round(progress)}%</span>
          </div>
        ) : Icon ? (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${toneClasses}`}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {loading ? '…' : value ?? 0}
      </p>
      {subtext ? <p className="mt-1 text-[11px] text-ink-400 font-medium truncate">{subtext}</p> : null}
    </div>
  );
}
