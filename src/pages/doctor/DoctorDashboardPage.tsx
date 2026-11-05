import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardPlus,
  Building2,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Lock,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  Search,
  ChevronRight,
  Activity,
  FileText,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { PortalHeroBanner } from '../../components/ui/PortalHeroBanner';
import { useAuth } from '../../providers/AuthProvider';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import type { OrganizationContextResponse } from '../../types/organization';
import { paths } from '../../routes/paths';
import { fadeUp, stagger } from '../../animations/variants';

interface AppointmentRow {
  id: string;
  grant_id: string | number | null;
  patient_name: string | null;
  title: string;
  date: string;
  time: string;
  status: string;
}
interface GrantRow {
  id: string | number;
  patient_name: string;
  status: string;
}

export default function DoctorDashboardPage() {
  const { profile } = useAuth();
  const appointmentsQuery = useAuthenticatedApi<AppointmentRow[]>('/api/appointments');
  const grantsQuery = useAuthenticatedApi<GrantRow[]>('/api/access-grants');
  const orgQuery = useAuthenticatedApi<OrganizationContextResponse>('/api/organizations/me');

  const appointments = appointmentsQuery.data ?? [];
  const grants = grantsQuery.data ?? [];
  const orgContext = orgQuery.data;
  const hospital = orgContext?.organization;

  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((item) => item.date === today);
  const activeGrants = grants.filter((item) => item.status === 'active');
  const waiting = todayAppointments.filter((item) => item.status === 'upcoming' || item.status === 'waiting' || item.status === 'in-progress');
  const completed = todayAppointments.filter((item) => item.status === 'completed');
  const error = appointmentsQuery.isError || grantsQuery.isError || orgQuery.isError;
  const loading = appointmentsQuery.isLoading || grantsQuery.isLoading;

  const hospitalAddress = [hospital?.address_line_1, hospital?.city, hospital?.state, hospital?.postal_code]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <Seo
        title="Doctor Workspace — WellNest"
        description="Appointments, patient consent panels, and clinical hospital affiliation."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Clinician Header */}
        <motion.div variants={fadeUp}>
          <PortalHeroBanner
            className="doctor-hero"
            roleLabel="Verified Doctor Account"
            title={`Dr. ${profile?.fullName || 'Physician'}`}
            description={[
              'Personal Professional Profile',
              profile?.professionalTitle || 'Attending Clinician',
              profile?.specialty || 'General Practice',
              profile?.licenseNumber ? `License #${profile.licenseNumber}` : null,
            ].filter(Boolean).join(' · ')}
            aside={profile?.specialty ? <Badge tone="emerald">{profile.specialty}</Badge> : undefined}
            actions={
              <>
                <Button
                  to={paths.app.lookup}
                  variant="outline"
                  size="sm"
                  className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20"
                  leftIcon={<Search className="h-3.5 w-3.5" />}
                >
                  Lookup Health ID
                </Button>
                <Button to={paths.app.doctorAppointments} size="sm" leftIcon={<Calendar className="h-3.5 w-3.5" />}>
                  Today's Clinic ({todayAppointments.length})
                </Button>
                <Button to={paths.app.doctorPatients} variant="outline" size="sm" leftIcon={<Users className="h-3.5 w-3.5" />}>
                  Consented Panel
                </Button>
              </>
            }
          />
        </motion.div>

        {/* Hospital Facility Card ("Working at [Hospital]") */}
        <motion.section
          variants={fadeUp}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b border-slate-100 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-brand-700 font-display text-xl font-bold">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                    Working at
                  </span>
                  {hospital?.status === 'verified' ? (
                    <span className="text-[11px] text-ink-400">· Verified organization</span>
                  ) : null}
                </div>
                <h2 className="text-lg font-bold text-ink-900 sm:text-xl">
                  {hospital?.display_name || profile?.organization || (orgQuery.isLoading ? 'Loading affiliation…' : 'No organization affiliation listed')}
                </h2>
                {hospital?.display_name || profile?.organization ? (
                  <p className="text-xs text-ink-500 mt-0.5">Organization affiliation</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hospital?.status === 'verified' ? (
                <Badge tone="emerald" className="gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Organization
                </Badge>
              ) : (
                hospital?.status ? <Badge tone="amber">Status: {hospital.status}</Badge> : null
              )}
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-600">
            {hospitalAddress ? (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                <span>{hospitalAddress}</span>
              </span>
            ) : null}

            {hospital?.phone ? (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Phone className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                <span>{hospital.phone}</span>
              </span>
            ) : null}

            {hospital?.email ? (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Mail className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                <span>{hospital.email}</span>
              </span>
            ) : null}

            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-ink-400">
              <Lock className="h-3 w-3 text-slate-400" />
              <span>Hospital assignment is managed by hospital administration</span>
            </span>
          </div>
        </motion.section>

        {error ? (
          <Alert tone="error" title="Doctor workspace data unavailable">
            {appointmentsQuery.error?.message || grantsQuery.error?.message || orgQuery.error?.message || 'Check your connection and retry.'}
          </Alert>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : null}

        {!error && !loading ? (
          <>
            {/* Stat Row */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              <div className="workspace-metric rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-brand-700">Today's Clinic</p>
                  <Calendar className="h-4 w-4 text-brand-600" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
                  {todayAppointments.length}
                </p>
                <p className="mt-1 text-[11px] text-brand-600 font-medium">Scheduled visits</p>
              </div>

              <div className="workspace-metric rounded-xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-amber-800">Waiting / In Progress</p>
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight text-amber-900 sm:text-3xl">
                  {waiting.length}
                </p>
                <p className="mt-1 text-[11px] text-amber-700 font-medium">Ready for consultation</p>
              </div>

              <div className="workspace-metric rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-emerald-800">Completed Today</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight text-emerald-900 sm:text-3xl">
                  {completed.length}
                </p>
                <p className="mt-1 text-[11px] text-emerald-700 font-medium">Encounters closed</p>
              </div>

              <div className="workspace-metric rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink-500">Active Patient Grants</p>
                  <Users className="h-4 w-4 text-ink-400" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                  {activeGrants.length}
                </p>
                <p className="mt-1 text-[11px] text-ink-400 font-medium">Consented patient panel</p>
              </div>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div variants={fadeUp} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">Clinical Quick Actions</p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Button to={paths.app.lookup} variant="outline" size="sm" leftIcon={<Search className="h-3.5 w-3.5" />}>
                  Lookup Health ID
                </Button>
                <Button to={paths.app.doctorPrescriptions} variant="outline" size="sm" leftIcon={<ClipboardPlus className="h-3.5 w-3.5" />}>
                  Issue Prescription
                </Button>
                <Button to={paths.app.doctorReports} variant="outline" size="sm" leftIcon={<FileText className="h-3.5 w-3.5" />}>
                  Consented Reports
                </Button>
                <Button to={paths.app.doctorWorkflow} variant="outline" size="sm" leftIcon={<Activity className="h-3.5 w-3.5" />}>
                  Clinical Workflow
                </Button>
              </div>
            </motion.div>

            {/* Main Schedule & Consent Feed */}
            <div className="grid gap-5 xl:grid-cols-12">
              {/* Today's Schedule (7 cols) */}
              <Card className="xl:col-span-7">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-700" />
                    <div>
                      <h2 className="text-sm font-semibold text-ink-900">Today's Clinic Queue</h2>
                      <p className="text-[11px] text-ink-500">{todayAppointments.length} patients scheduled for today</p>
                    </div>
                  </div>
                  <Link to={paths.app.doctorAppointments} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                    Full schedule <ChevronRight className="inline h-3 w-3" />
                  </Link>
                </div>

                {todayAppointments.length ? (
                  <div className="space-y-2.5">
                    {todayAppointments.map((item) => {
                      const grant = activeGrants.find((entry) => String(entry.id) === String(item.grant_id));
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:bg-slate-100/70 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-brand-800 font-semibold text-xs">
                              {item.time || 'Visit'}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-ink-900">
                                {grant?.patient_name || item.patient_name || 'Patient'}
                              </p>
                              <p className="mt-0.5 text-[11px] text-ink-500">
                                {item.title}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Badge
                              tone={
                                item.status === 'completed'
                                  ? 'emerald'
                                  : item.status === 'in-progress'
                                    ? 'brand'
                                    : 'amber'
                              }
                              className="capitalize text-[10px]"
                            >
                              {item.status.replace('-', ' ')}
                            </Badge>
                            {grant ? (
                              <Button to={paths.app.doctorPatient(String(grant.id))} size="sm" variant="outline">
                                Open Chart
                              </Button>
                            ) : (
                              <Button to={paths.app.doctorAppointments} size="sm" variant="ghost">
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No appointments scheduled today"
                    description="When patients book or are routed to your schedule for today, they will appear in this clinic worklist."
                    icon={Calendar}
                  />
                )}
              </Card>

              {/* Consented Patient Panel (5 cols) */}
              <Card className="xl:col-span-5">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand-700" />
                    <div>
                      <h2 className="text-sm font-semibold text-ink-900">Active Patient Grants</h2>
                      <p className="text-[11px] text-ink-500">{activeGrants.length} active consents</p>
                    </div>
                  </div>
                  <Link to={paths.app.doctorPatients} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                    All patients <ChevronRight className="inline h-3 w-3" />
                  </Link>
                </div>

                {activeGrants.length ? (
                  <div className="divide-y divide-slate-100">
                    {activeGrants.slice(0, 5).map((grant) => (
                      <div key={grant.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-ink-700">
                            {grant.patient_name ? grant.patient_name.slice(0, 2).toUpperCase() : 'PT'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-ink-900">{grant.patient_name || 'Patient'}</p>
                            <span className="text-[10px] text-emerald-700 font-medium">Active Consent</span>
                          </div>
                        </div>
                        <Button to={paths.app.doctorPatient(String(grant.id))} size="sm" variant="outline">
                          Chart
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No active patient grants"
                    description="Request consent from a patient or verify their Health ID to review clinical records."
                    icon={Users}
                  />
                )}
              </Card>
            </div>
          </>
        ) : null}
      </motion.div>
    </>
  );
}
