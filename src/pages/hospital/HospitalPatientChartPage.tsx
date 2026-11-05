import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Bed,
  Calendar,
  Pill,
  Heart,
  AlertTriangle,
  Stethoscope,
  ShieldCheck,
  Building2,
  Clock,
  User,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { VerificationPill } from '../../components/doctor/VerificationPill';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { formatDate } from '../../utils/format';
import { paths } from '../../routes/paths';
import { cn } from '../../utils/cn';

export default function HospitalPatientChartPage() {
  const { patientId } = useParams();
  const portal = useHospitalPortal();
  const [tab, setTab] = useState<'overview' | 'admissions' | 'reports' | 'consults' | 'appointments'>('overview');

  const patient = portal.patients.find((p) => p.id === patientId);
  if (!patient) {
    return (
      <EmptyState
        title="Chart not found"
        description="The requested patient MRN is not registered on this hospital campus."
        actionLabel="Back to Patient Directory"
        onAction={() => window.location.assign(paths.app.hospitalPatients)}
      />
    );
  }

  const appts = portal.appointments.filter((a) => a.patientId === patient.id);
  const reports = portal.reports.filter((r) => r.patientId === patient.id);
  const admits = portal.admits.filter((a) => a.patientId === patient.id);
  const activeAdmit = admits.find((a) => a.status !== 'discharged');
  const consults = portal.consults.filter((c) => c.patientId === patient.id);
  const attendingDoctor = activeAdmit ? portal.doctors.find((d) => d.id === activeAdmit.doctorId) : undefined;
  const dept = activeAdmit ? portal.depts.find((d) => d.id === activeAdmit.departmentId) : undefined;

  return (
    <>
      <Seo title={`${patient.name} — Hospital Chart`} description="Hospital inpatient chart." />

      <div className="mb-4">
        <Link
          to={paths.app.hospitalPatients}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to patient directory
        </Link>
      </div>

      {/* Hospital Chart Master Header */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 mb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={patient.name} src={patient.avatar} size="lg" className="h-16 w-16" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                  Hospital Electronic Chart
                </span>
                <span className="font-mono text-xs text-ink-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                  MRN: {patient.mrn}
                </span>
                {patient.bloodGroup ? (
                  <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                    Blood: {patient.bloodGroup}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                {patient.name}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
                <span>Age: {patient.age} yrs</span>
                <span>City: {patient.city}</span>
                {activeAdmit ? (
                  <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Room {activeAdmit.room} · Bed {activeAdmit.bed} ({dept?.name || 'Inpatient'})
                  </span>
                ) : (
                  <span className="text-ink-400">Outpatient Status</span>
                )}
                {attendingDoctor ? (
                  <span className="font-medium text-ink-800">
                    Attending: Dr. {attendingDoctor.name}
                  </span>
                ) : null}
              </div>

              {patient.allergies.length > 0 ? (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <AlertTriangle className="h-3 w-3" /> Allergies: {patient.allergies.join(', ')}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeAdmit ? (
              <Badge tone="brand" className="text-xs">
                Inpatient Stay: {activeAdmit.status.replace('-', ' ')}
              </Badge>
            ) : (
              <Badge tone="slate" className="text-xs">
                Outpatient
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Summary & Vitals', count: null },
          { id: 'admissions', label: 'Inpatient Stays', count: admits.length },
          { id: 'reports', label: 'Diagnostic Reports', count: reports.length },
          { id: 'consults', label: 'Consults & Rx', count: consults.length },
          { id: 'appointments', label: 'Appointments', count: appts.length },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
              tab === t.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50'
            )}
          >
            <span>{t.label}</span>
            {t.count !== null ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  tab === t.id ? 'bg-brand-700 text-white' : 'bg-slate-100 text-ink-600'
                )}
              >
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Admission Details */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-brand-700" />
                <h2 className="text-sm font-semibold text-ink-900">Current Stay Information</h2>
              </div>
              {activeAdmit ? (
                <Badge tone="brand">{activeAdmit.status.replace('-', ' ')}</Badge>
              ) : null}
            </div>

            {activeAdmit ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div>
                    <span className="text-ink-400">Ward & Bed</span>
                    <p className="font-semibold text-ink-900 mt-0.5">
                      Room {activeAdmit.room} · Bed {activeAdmit.bed}
                    </p>
                  </div>
                  <div>
                    <span className="text-ink-400">Department</span>
                    <p className="font-semibold text-ink-900 mt-0.5">{dept?.name || 'General Inpatient'}</p>
                  </div>
                  <div>
                    <span className="text-ink-400">Admission Date</span>
                    <p className="font-semibold text-ink-900 mt-0.5">{formatDate(activeAdmit.admitted)}</p>
                  </div>
                  <div>
                    <span className="text-ink-400">Expected Discharge</span>
                    <p className="font-semibold text-ink-900 mt-0.5">{formatDate(activeAdmit.expected)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <span className="font-semibold text-ink-800">Primary Indication:</span>
                  <p className="mt-1 text-ink-600">{activeAdmit.reason}</p>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No active inpatient stay"
                description="Patient is currently seen on an outpatient basis."
                icon={Bed}
              />
            )}
          </Card>

          {/* Recent Reports */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-700" />
                <h2 className="text-sm font-semibold text-ink-900">Recent Diagnostic Reports</h2>
              </div>
              <button
                onClick={() => setTab('reports')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                All ({reports.length})
              </button>
            </div>

            {reports.length ? (
              <div className="space-y-2.5">
                {reports.slice(0, 3).map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-ink-900">{r.title}</p>
                        <p className="text-[11px] text-ink-400">{r.uploader}</p>
                      </div>
                      <VerificationPill
                        source={
                          r.source === 'patient'
                            ? 'patient'
                            : r.source === 'laboratory'
                              ? 'laboratory'
                              : r.source === 'doctor'
                                ? 'doctor'
                                : 'hospital'
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No reports on file" description="Clinical lab reports will appear here." />
            )}
          </Card>
        </div>
      ) : null}

      {/* Tab: Admissions */}
      {tab === 'admissions' ? (
        <Card>
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-ink-900">Inpatient Admission History</h2>
          </div>
          {admits.length === 0 ? (
            <EmptyState title="No inpatient admissions on file" description="Inpatient records will appear here." />
          ) : (
            <div className="space-y-3">
              {admits.map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-ink-900 text-sm">
                        Room {a.room} · Bed {a.bed}
                      </p>
                      <p className="text-xs text-ink-500 mt-0.5">
                        Admitted: {formatDate(a.admitted)} · Exp. Discharge: {formatDate(a.expected)}
                      </p>
                      <p className="mt-2 text-xs text-ink-700 bg-white p-2.5 rounded border border-slate-100">
                        {a.reason}
                      </p>
                    </div>
                    <Badge className="capitalize">{a.status.replace('-', ' ')}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {/* Tab: Reports */}
      {tab === 'reports' ? (
        <Card>
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-ink-900">Diagnostic Reports & Results</h2>
          </div>
          {reports.length === 0 ? (
            <EmptyState title="No reports on file" description="Diagnostic results will appear here." />
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-ink-900 text-sm">{r.title}</h3>
                      <p className="text-xs text-ink-400 mt-0.5">Released by {r.uploader}</p>
                    </div>
                    <VerificationPill
                      source={
                        r.source === 'patient'
                          ? 'patient'
                          : r.source === 'laboratory'
                            ? 'laboratory'
                            : r.source === 'doctor'
                              ? 'doctor'
                              : 'hospital'
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {/* Tab: Consults & Prescriptions */}
      {tab === 'consults' ? (
        <Card>
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-ink-900">Consultation Notes & Medication Orders</h2>
          </div>
          {consults.length === 0 ? (
            <EmptyState title="No consultations recorded" description="Doctor notes will appear here." />
          ) : (
            <div className="space-y-3">
              {consults.map((c) => {
                const doc = portal.doctors.find((d) => d.id === c.doctorId);
                return (
                  <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="font-semibold text-ink-900 text-sm">{c.diagnosis}</p>
                    <p className="text-xs text-brand-700 mt-0.5 font-medium">
                      Physician: {doc?.name || 'Attending Physician'}
                    </p>
                    <div className="mt-2 text-xs text-ink-700 bg-white p-2.5 rounded border border-slate-100">
                      <span className="font-semibold text-ink-900">Prescription Order: </span>
                      {c.rx}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : null}

      {/* Tab: Appointments */}
      {tab === 'appointments' ? (
        <Card>
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-ink-900">Campus Appointment History</h2>
          </div>
          {appts.length === 0 ? (
            <EmptyState title="No appointments scheduled" description="Outpatient clinic visits will appear here." />
          ) : (
            <div className="space-y-3">
              {appts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div>
                    <p className="font-semibold text-ink-900 text-sm">{a.reason}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{a.date} at {a.time}</p>
                  </div>
                  <Badge className="capitalize">{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}
    </>
  );
}
