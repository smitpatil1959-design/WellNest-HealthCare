import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FileText,
  Pill,
  Calendar,
  ArrowLeft,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  FlaskConical,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { paths } from '../../routes/paths';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/format';
import { grantAllowsConsentCategory } from '../../../shared/consent-categories.js';

interface GrantRow {
  id: string | number;
  patient_name: string;
  categories: string;
  status: string;
  expires_at: string | null;
}

interface RecordRow {
  id: string;
  title: string;
  category: string;
  summary: string | null;
  date: string;
  doctor: string | null;
  hospital: string | null;
  laboratory: string | null;
  created_at: string;
}

interface PrescriptionRow {
  id: string;
  medicine: string;
  dosage: string;
  duration: string;
  instructions: string;
  active: boolean;
  issued: string;
  created_at: string;
}

interface AppointmentRow {
  id: string;
  grant_id: string | number | null;
  title: string;
  date: string;
  time: string;
  status: string;
}

interface LabReportRow {
  id: string;
  test_name: string;
  result: string | null;
  status: string;
  collected_at: string | null;
  released_at: string | null;
  created_at: string;
}

const tabs = [
  { id: 'overview', label: 'Chart Overview', icon: ClipboardList },
  { id: 'records', label: 'Clinical Records', icon: FileText },
  { id: 'labs', label: 'Lab Results', icon: FlaskConical },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'consent', label: 'Access Grant', icon: ShieldCheck },
] as const;

export default function DoctorPatientProfilePage() {
  const { grantId = '' } = useParams();
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('overview');
  const grantsQuery = useAuthenticatedApi<GrantRow[]>('/api/access-grants');
  const grant = (grantsQuery.data ?? []).find(
    (item) => String(item.id) === grantId && item.status === 'active'
  );
  const recordsQuery = useAuthenticatedApi<RecordRow[]>(
    `/api/records?grantId=${encodeURIComponent(grantId)}`,
    Boolean(grantId)
  );
  const prescriptionsQuery = useAuthenticatedApi<PrescriptionRow[]>(
    `/api/prescriptions?grantId=${encodeURIComponent(grantId)}`,
    Boolean(grantId)
  );
  const appointmentsQuery = useAuthenticatedApi<AppointmentRow[]>('/api/appointments');
  const canViewLabs = Boolean(grant && grantAllowsConsentCategory(grant, 'lab_report'));
  const labsQuery = useAuthenticatedApi<LabReportRow[]>(
    `/api/lab-reports?grantId=${encodeURIComponent(grantId)}`,
    canViewLabs,
  );

  const records = recordsQuery.data ?? [];
  const labReports = labsQuery.data ?? [];
  const prescriptions = prescriptionsQuery.data ?? [];
  const appointments = (appointmentsQuery.data ?? []).filter(
    (item) => String(item.grant_id) === grantId
  );
  const queryError = recordsQuery.isError || prescriptionsQuery.isError || appointmentsQuery.isError || labsQuery.isError;

  if (grantsQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (grantsQuery.isError) {
    return (
      <Alert tone="error" title="Consent status unavailable">
        {grantsQuery.error?.message || 'Check your connection and retry.'}
      </Alert>
    );
  }

  if (!grant) {
    return (
      <EmptyState
        title="No active patient consent"
        description="This clinical chart is available only while the patient has an active consent grant for your verified account."
        actionLabel="Back to Patient Panel"
        onAction={() => window.location.assign(paths.app.doctorPatients)}
      />
    );
  }

  const patientName = grant.patient_name || 'Patient';
  const initials = patientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <Seo
        title={`${patientName} — Clinical Chart`}
        description="Patient clinical information available under an active consent grant."
      />

      <div className="mb-4">
        <Link
          to={paths.app.doctorPatients}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to patients panel</span>
        </Link>
      </div>

      {/* Patient Clinical Profile Header */}
      <div className="mb-6 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/70 via-white to-slate-50/80 p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-lg font-bold text-white shadow-xs">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                  Consented Patient Chart
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" /> Active Consent
                </span>
              </div>
              <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                {patientName}
              </h1>
              <p className="mt-1 text-xs text-ink-500">
                Authorized scope: <span className="font-semibold text-ink-700">{grant.categories || 'All Medical Records'}</span>
                {grant.expires_at ? ` · Expires: ${formatDate(grant.expires_at)}` : ' · No expiration'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button to={paths.app.doctorConsult(String(grant.id))} size="sm" leftIcon={<Stethoscope className="h-4 w-4" />}>
              Write Visit Note
            </Button>
            <Button to={paths.app.doctorPrescriptions} variant="outline" size="sm" leftIcon={<Pill className="h-4 w-4" />}>
              Prescribe
            </Button>
          </div>
        </div>
      </div>

      {queryError ? (
        <Alert tone="error" title="Some chart data could not be loaded" className="mb-4">
          One or more authorized records failed to load. Retry after checking your connection.
        </Alert>
      ) : null}

      {/* Metric Cards Row */}
      <div className="mb-6 grid grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Consented Records</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{records.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800">Prescriptions</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-900">{prescriptions.length}</p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-sky-800">Appointments</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-sky-900">{appointments.length}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => {
          const Icon = item.icon;
          const isSelected = tab === item.id;
          const count =
            item.id === 'records'
              ? records.length
              : item.id === 'prescriptions'
                ? prescriptions.length
                : item.id === 'labs'
                  ? canViewLabs ? labReports.length : null
                : item.id === 'appointments'
                  ? appointments.length
                  : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
                isSelected
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {count !== null ? (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                    isSelected ? 'bg-brand-700 text-white' : 'bg-slate-100 text-ink-600'
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Loading state for subqueries */}
      {recordsQuery.isLoading || prescriptionsQuery.isLoading || appointmentsQuery.isLoading || (canViewLabs && labsQuery.isLoading) ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : null}

      {/* Tab: Chart Overview */}
      {tab === 'overview' && !queryError ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Medical Records */}
            <Card>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-700" />
                  <h2 className="text-sm font-semibold text-ink-900">Recent Medical Records</h2>
                </div>
                <button
                  onClick={() => setTab('records')}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  View all ({records.length})
                </button>
              </div>

              {records.length ? (
                <div className="space-y-3">
                  {records.slice(0, 3).map((r) => (
                    <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-ink-900">{r.title}</p>
                          <p className="text-[11px] text-ink-500">
                            {r.category} · {formatDate(r.date)}
                          </p>
                        </div>
                        <Badge tone="slate" className="text-[10px] capitalize">
                          {r.doctor || r.hospital || 'Clinical'}
                        </Badge>
                      </div>
                      {r.summary ? (
                        <p className="mt-1.5 text-xs text-ink-600 line-clamp-2">{r.summary}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No records available" description="Records will appear under active consent." />
              )}
            </Card>

            {/* Current Prescriptions */}
            <Card>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-brand-700" />
                  <h2 className="text-sm font-semibold text-ink-900">Active Prescriptions</h2>
                </div>
                <button
                  onClick={() => setTab('prescriptions')}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  View all ({prescriptions.length})
                </button>
              </div>

              {prescriptions.length ? (
                <div className="space-y-3">
                  {prescriptions.slice(0, 3).map((rx) => (
                    <div key={rx.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-ink-900">{rx.medicine}</p>
                          <p className="text-[11px] text-ink-500">
                            {rx.dosage} · Duration: {rx.duration}
                          </p>
                        </div>
                        <Badge tone={rx.active ? 'emerald' : 'slate'} className="text-[10px]">
                          {rx.active ? 'Active' : 'Completed'}
                        </Badge>
                      </div>
                      {rx.instructions ? (
                        <p className="mt-1.5 text-xs text-ink-600 line-clamp-2">{rx.instructions}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No prescriptions" description="Prescriptions will appear when ordered." />
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {/* Tab: Records */}
      {tab === 'records' ? (
        <div className="space-y-3">
          {records.length ? (
            records.map((record) => (
              <Card key={record.id} hover className="transition-all">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-ink-900">{record.title}</h3>
                    <p className="mt-1 text-xs text-ink-500 font-medium">
                      {record.category} · {formatDate(record.date)}
                    </p>
                    {record.summary ? (
                      <p className="mt-2 text-sm text-ink-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {record.summary}
                      </p>
                    ) : null}
                  </div>
                  <Badge tone="brand">
                    {record.doctor || record.laboratory || record.hospital || 'Clinical source'}
                  </Badge>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No records in granted categories"
              description="Only records covered by the patient's active consent are displayed."
              icon={FileText}
            />
          )}
        </div>
      ) : null}

      {/* Tab: Prescriptions */}
      {tab === 'prescriptions' ? (
        <div className="space-y-3">
          {prescriptions.length ? (
            prescriptions.map((rx) => (
              <Card key={rx.id} hover className="transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink-900">{rx.medicine} · {rx.dosage}</h3>
                    <p className="mt-1 text-xs text-ink-500 font-medium">
                      Duration: {rx.duration} · Issued {formatDate(rx.issued)}
                    </p>
                  </div>
                  <Badge tone={rx.active ? 'emerald' : 'slate'}>
                    {rx.active ? 'Active' : 'Completed'}
                  </Badge>
                </div>
                {rx.instructions ? (
                  <p className="mt-2 text-xs text-ink-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-ink-700">Instructions: </span>
                    {rx.instructions}
                  </p>
                ) : null}

              </Card>
            ))
          ) : (
            <EmptyState
              title="No consented prescriptions"
              description="Prescriptions appear when the active grant includes prescription access."
              icon={Pill}
            />
          )}
        </div>
      ) : null}

      {tab === 'labs' ? (
        !canViewLabs ? (
          <EmptyState
            title="Laboratory access not included"
            description="This active consent grant does not include laboratory reports. The patient controls which record categories are shared."
            icon={ShieldCheck}
          />
        ) : labReports.length ? (
          <div className="space-y-3">
            {labReports.map((report) => (
              <Card key={report.id} className="transition-all">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                      <FlaskConical className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink-900">{report.test_name}</h3>
                      <p className="mt-1 text-xs text-ink-500">
                        {report.collected_at || report.released_at
                          ? formatDate(report.collected_at || report.released_at || '')
                          : 'Date not provided'}
                      </p>
                      {report.result ? <p className="mt-2 text-sm text-ink-700">{report.result}</p> : null}
                    </div>
                  </div>
                  <Badge tone={report.status.toLowerCase() === 'released' ? 'emerald' : 'slate'} className="capitalize">
                    {report.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No lab results available"
            description="Laboratory reports covered by the active consent grant will appear here."
            icon={FlaskConical}
          />
        )
      ) : null}

      {/* Tab: Appointments */}
      {tab === 'appointments' ? (
        <div className="space-y-3">
          {appointments.length ? (
            appointments.map((appointment) => (
              <Card key={appointment.id} hover className="transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-ink-900">{appointment.title}</h3>
                    <p className="mt-1 text-xs text-ink-500 font-medium">
                      {formatDate(appointment.date)} at {appointment.time}
                    </p>
                  </div>
                  <Badge className="capitalize">{appointment.status}</Badge>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No appointments recorded"
              description="Appointments associated with this patient and your doctor account appear here."
              icon={Calendar}
            />
          )}
        </div>
      ) : null}

      {tab === 'consent' ? (
        <Card>
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <h2 className="text-sm font-semibold text-ink-900">Patient access grant</h2>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-ink-500">Grant status</dt>
              <dd className="mt-1"><Badge tone="emerald">Active consent</Badge></dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-500">Grant reference</dt>
              <dd className="mt-1 text-sm font-semibold text-ink-900">#{grant.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-500">Authorized categories</dt>
              <dd className="mt-1 text-sm font-semibold text-ink-900">{grant.categories || 'All medical records'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-500">Expires</dt>
              <dd className="mt-1 text-sm font-semibold text-ink-900">
                {grant.expires_at ? formatDate(grant.expires_at) : 'No scheduled expiry'}
              </dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </>
  );
}
