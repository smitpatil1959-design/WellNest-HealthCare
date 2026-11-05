import { useParams, Link } from 'react-router-dom';
import {
  FlaskConical,
  User,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronLeft,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useLabPortal } from '../../hooks/useLabPortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import type { LabTestStatus } from '../../types/lab';

const flow: { id: LabTestStatus; label: string; desc: string }[] = [
  { id: 'requested', label: 'Requested', desc: 'Physician order received' },
  { id: 'pending', label: 'Pending Accession', desc: 'Specimen awaiting intake' },
  { id: 'in-progress', label: 'In-Progress', desc: 'On diagnostic analyzer' },
  { id: 'resulted', label: 'Resulted', desc: 'Analytes recorded' },
  { id: 'awaiting-verify', label: 'Awaiting Verify', desc: 'Pending pathologist sign-off' },
  { id: 'published', label: 'Published', desc: 'Released to patient EMR' },
];

export default function LabTestDetailPage() {
  const { testId } = useParams();
  const { orders, setOrderStatus, reports } = useLabPortal();
  const order = orders.find((o) => o.id === testId);

  if (!order) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="Specimen Accession Not Found"
        description="The requested specimen accession ID does not exist in this laboratory's database."
      >
        <Button to={paths.app.labTests} size="sm" variant="outline" className="mt-4" leftIcon={<ChevronLeft className="h-4 w-4" />}>
          Back to Test Worklist
        </Button>
      </EmptyState>
    );
  }

  const report = reports.find((r) => r.orderId === order.id);
  const currentStepIndex = flow.findIndex((s) => s.id === order.status);

  const getPriorityTone = (priority: string): BadgeTone => {
    switch (priority) {
      case 'critical':
        return 'rose';
      case 'stat':
        return 'amber';
      default:
        return 'slate';
    }
  };

  const getStatusTone = (status: string): BadgeTone => {
    switch (status) {
      case 'published':
        return 'emerald';
      case 'resulted':
        return 'brand';
      case 'awaiting-verify':
        return 'brand';
      case 'in-progress':
        return 'sky';
      case 'pending':
        return 'amber';
      default:
        return 'slate';
    }
  };

  return (
    <>
      <Seo title={`${order.accession} - ${order.test}`} description={order.test} />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
            <Link to={paths.app.labTests} className="hover:text-brand-700 transition flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" /> Tests Worklist
            </Link>
            <span>/</span>
            <span className="font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded">{order.accession}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-900 sm:text-3xl">{order.test}</h1>
          <p className="text-xs text-ink-500">
            Specimen Modality: <span className="font-medium text-ink-700 capitalize">{order.kind}</span> · Accession ID:{' '}
            <span className="font-mono">{order.id}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={getPriorityTone(order.priority)} className="uppercase text-xs font-bold">
            {order.priority}
          </Badge>
          <Badge tone={getStatusTone(order.status)} className="capitalize text-xs">
            {order.status.replace('-', ' ')}
          </Badge>
          {report ? (
            <Button to={paths.app.labReport(report.id)} size="sm" leftIcon={<FileText className="h-4 w-4" />}>
              Open Diagnostic Report
            </Button>
          ) : (
            <Button to={paths.app.labCompose} size="sm" variant="outline" leftIcon={<FlaskConical className="h-4 w-4" />}>
              Enter Analytes / Report
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main 2 Columns: Specimen Traceability & Status Progression */}
        <div className="space-y-6 lg:col-span-2">
          {/* Visual Workflow Stepper */}
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-ink-900">Laboratory Traceability Lifecycle</h2>
                <p className="text-xs text-ink-500">CLIA Chain-of-custody from order receipt to final release</p>
              </div>
              <span className="font-mono text-xs font-semibold text-brand-700">Step {currentStepIndex + 1} of 6</span>
            </div>

            {/* Stepper bar */}
            <div className="mt-4 grid grid-cols-6 gap-1.5">
              {flow.map((s, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={s.id} className="text-center">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isPassed ? (isCurrent ? 'bg-brand-600 ring-2 ring-brand-300' : 'bg-brand-600') : 'bg-slate-100'
                      }`}
                    />
                    <p className={`mt-2 text-[10px] font-semibold hidden sm:block ${isPassed ? 'text-brand-800' : 'text-ink-400'}`}>
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-ink-700">
                  Current Status: <span className="capitalize text-ink-900">{order.status.replace('-', ' ')}</span>
                </p>
                <p className="text-[11px] text-ink-500">
                  {flow[currentStepIndex]?.desc || 'Specimen processing in laboratory workflow'}
                </p>
              </div>

              {order.status !== 'published' && (
                <Button
                  size="sm"
                  onClick={async () => {
                    const nextIndex = Math.min(flow.length - 1, currentStepIndex + 1);
                    if (!(await setOrderStatus(order.id, flow[nextIndex].id))) return;
                  }}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Advance to {flow[Math.min(flow.length - 1, currentStepIndex + 1)]?.label}
                </Button>
              )}
            </div>
          </Card>

          {/* Test & Specimen Information */}
          <Card>
            <h2 className="text-sm font-semibold text-ink-900 border-b border-slate-100 pb-3">Specimen Intake & Order Attributes</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Accession Number</dt>
                <dd className="mt-1 font-mono font-bold text-ink-900 text-sm">{order.accession}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Test Description</dt>
                <dd className="mt-1 font-semibold text-ink-900 text-sm">{order.test}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Modality / Discipline</dt>
                <dd className="mt-1 font-medium text-ink-900 capitalize">{order.kind} Diagnostic Panel</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Priority Protocol</dt>
                <dd className="mt-1 font-semibold uppercase text-brand-700">{order.priority}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Order Requisition Date</dt>
                <dd className="mt-1 font-medium text-ink-900">{formatDate(order.requested)}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Specimen Collection Date</dt>
                <dd className="mt-1 font-medium text-ink-900">{order.collected ? formatDate(order.collected) : 'Pending phlebotomy'}</dd>
              </div>
            </dl>
          </Card>

          {/* Report Link or Creation Card */}
          <Card>
            <h2 className="text-sm font-semibold text-ink-900 border-b border-slate-100 pb-3">Diagnostic Analysis & Report Status</h2>
            {report ? (
              <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/30 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-semibold text-brand-700">{report.reportId}</span>
                    <h3 className="mt-1 font-semibold text-ink-900">{report.title}</h3>
                    <p className="mt-1 text-xs text-ink-600 line-clamp-2">{report.impression || 'Diagnostic interpretation recorded.'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone={report.status === 'published' ? 'emerald' : report.status === 'verified' ? 'brand' : 'amber'} className="text-[10px]">
                        {report.status}
                      </Badge>
                      <span className="text-[11px] text-ink-400">{report.analytes.length} Analytes Measured</span>
                    </div>
                  </div>
                  <Button to={paths.app.labReport(report.id)} size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    View Full Report
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <FlaskConical className="mx-auto h-8 w-8 text-ink-400" />
                <p className="mt-2 text-xs font-semibold text-ink-800">No Diagnostic Report Generated Yet</p>
                <p className="mt-1 text-[11px] text-ink-500">Record analyte values, standard deviations, and pathologist impression.</p>
                <Button to={paths.app.labCompose} size="sm" variant="outline" className="mt-4" leftIcon={<Activity className="h-4 w-4" />}>
                  Enter Analyte Results
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar: Patient & Clinician Demographics */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-ink-900 border-b border-slate-100 pb-3">Patient Context</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 font-bold text-brand-700">
                {order.patientName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-ink-900">{order.patientName}</p>
                <p className="text-xs text-ink-500 font-mono">ID: {order.patientId}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-400">Hospital MRN:</span>
                <span className="font-mono font-medium text-ink-800">{order.mrn || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Ordering Physician:</span>
                <span className="font-medium text-ink-800">Dr. {order.doctor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Hospital Facility:</span>
                <span className="font-medium text-ink-800">{order.hospital}</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-ink-900">CLIA Quality Assurance</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-600">
              This specimen is processed under CAP & CLIA laboratory safety standards. Calibration curves, instrument controls, and control logs are validated for this run.
            </p>
            <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-[11px] text-ink-500">
              <span className="font-semibold text-ink-700">TAT Target:</span> Routine tests 24h · STAT orders within 120 mins.
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
