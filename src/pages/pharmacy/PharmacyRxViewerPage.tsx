import { useParams, Link } from 'react-router-dom';
import {
  Pill,
  ChevronLeft,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ArrowRight,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { usePharmacyPortal } from '../../hooks/usePharmacyPortal';
import { pharmacyOrg } from '../../constants/pharmacyData';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';
import type { RxStatus } from '../../types/pharmacy';

const flow: { id: RxStatus; label: string; desc: string }[] = [
  { id: 'pending', label: 'Pending', desc: 'Received in pharmacy queue' },
  { id: 'verifying', label: 'Verifying', desc: 'Pharmacist clinical check' },
  { id: 'processing', label: 'Processing', desc: 'Counting & bottle labeling' },
  { id: 'ready', label: 'Ready', desc: 'Staged at pickup register' },
  { id: 'completed', label: 'Dispensed', desc: 'Handed to patient' },
];

export default function PharmacyRxViewerPage() {
  const { rxId } = useParams();
  const { scripts, setStatus, can } = usePharmacyPortal();
  const rx = scripts.find((item) => item.id === rxId);

  if (!rx) {
    return (
      <EmptyState
        icon={Pill}
        title="Prescription Not Found"
        description="The requested prescription order was not found in this pharmacy's database."
      >
        <Button to={paths.app.pharmacyQueue} size="sm" variant="outline" className="mt-4" leftIcon={<ChevronLeft className="h-4 w-4" />}>
          Back to Queue
        </Button>
      </EmptyState>
    );
  }

  const unsigned = rx.source === 'patient';
  const currentStepIndex = flow.findIndex((s) => s.id === (rx.status === 'cancelled' ? 'pending' : rx.status));

  const getStatusTone = (status: string): BadgeTone => {
    switch (status) {
      case 'completed':
        return 'emerald';
      case 'ready':
        return 'brand';
      case 'processing':
      case 'verifying':
        return 'sky';
      case 'pending':
        return 'amber';
      case 'cancelled':
        return 'rose';
      default:
        return 'slate';
    }
  };

  return (
    <>
      <Seo title={`${rx.rxNumber} - ${rx.medicine}`} description={rx.medicine} />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
            <Link to={paths.app.pharmacyQueue} className="hover:text-brand-700 transition flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" /> Prescription Queue
            </Link>
            <span>/</span>
            <span className="font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded">{rx.rxNumber}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-900 sm:text-3xl">{rx.medicine}</h1>
          <p className="text-xs text-ink-500">
            Patient: <span className="font-medium text-ink-800">{rx.patientName}</span> · Prescriber: Dr. {rx.doctor}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={getStatusTone(rx.status)} className="capitalize text-xs font-semibold">
            {rx.status}
          </Badge>
          <Badge tone={unsigned ? 'amber' : 'emerald'} className="text-xs">
            {unsigned ? 'Patient Uploaded — Unverified' : `Signed by ${rx.source}`}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            leftIcon={<Printer className="h-3.5 w-3.5" />}
          >
            Print Rx Label
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols): Clinical Details, Sig Instructions & Allergies */}
        <div className="space-y-6 lg:col-span-2">
          {/* Prominent Sig & Dosing Card */}
          <Card className="border-brand-200 bg-gradient-to-br from-brand-50/40 via-white to-white">
            <div className="flex items-center justify-between border-b border-brand-100 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-brand-600" />
                <h2 className="text-sm font-bold text-brand-950 uppercase tracking-wide">
                  Clinical Sig & Administration Instructions
                </h2>
              </div>
              <span className="font-mono text-xs font-semibold text-brand-700">
                {rx.quantity ? `Qty: ${rx.quantity}` : 'Standard Package'}
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-white p-4 border border-brand-100 shadow-xs">
              <p className="font-mono text-base font-bold text-ink-900 sm:text-lg">
                {rx.sig || rx.dosage || 'Take as directed by prescribing physician.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-600 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-ink-400">Dosage Strength: </span>
                  <span className="font-semibold text-ink-800">{rx.dosage || 'Prescribed dose'}</span>
                </div>
                <div>
                  <span className="text-ink-400">Authorized Refills: </span>
                  <span className="font-semibold text-ink-800">{rx.refills} remaining</span>
                </div>
              </div>
            </div>

            {/* DUR & Allergy Alerts */}
            {rx.allergies.length > 0 && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-bold">Recorded Patient Allergies: </span>
                  {rx.allergies.join(', ')}
                </div>
              </div>
            )}

            {rx.interactions.length > 0 && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">Drug Utilization Review (DUR): </span>
                  {rx.interactions.join(' · ')}
                </div>
              </div>
            )}
          </Card>

          {/* Prescriber & Facility Information */}
          <Card>
            <h2 className="text-sm font-semibold text-ink-900 border-b border-slate-100 pb-3">Prescriber & Dispensing Metadata</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Ordering Clinician</dt>
                <dd className="mt-1 font-semibold text-ink-900 text-sm">Dr. {rx.doctor}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Hospital / Clinic</dt>
                <dd className="mt-1 font-medium text-ink-900 text-sm">{rx.hospital || 'Outpatient Clinic'}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Date Written</dt>
                <dd className="mt-1 font-medium text-ink-900">{formatDate(rx.written)}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Date Received in Pharmacy</dt>
                <dd className="mt-1 font-medium text-ink-900">{formatDate(rx.received)}</dd>
              </div>
            </dl>
            {rx.notes && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-ink-600 border border-slate-100">
                <span className="font-semibold text-ink-800">Prescriber Clinical Notes: </span>
                {rx.notes}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Dispensing Workflow Stepper & Actions */}
        <div className="space-y-6">
          {/* Workflow Stepper */}
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-ink-900">Dispensing Lifecycle</h2>
              <span className="font-mono text-xs font-semibold text-brand-700">Step {currentStepIndex + 1} of 5</span>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-1">
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

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs">
              <p className="font-semibold text-ink-800 capitalize">Stage: {rx.status}</p>
              <p className="text-[11px] text-ink-500 mt-0.5">{flow[currentStepIndex]?.desc}</p>
              {rx.verifier && (
                <p className="mt-2 text-[11px] text-brand-700">
                  Verified by {rx.verifier} {rx.verifiedAt ? `· ${formatDate(rx.verifiedAt)}` : ''}
                </p>
              )}
            </div>

            {unsigned ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <p className="font-semibold">Unauthenticated Prescription</p>
                <p className="mt-1 text-[11px]">Prescription verification is incomplete. Review the source and contact the prescriber if confirmation is needed before dispensing.</p>
              </div>
            ) : (can('orders') || can('all')) && rx.status !== 'completed' && rx.status !== 'cancelled' ? (
              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    const nextIndex = Math.min(flow.length - 1, currentStepIndex + 1);
                    if (!(await setStatus(rx.id, flow[nextIndex].id))) return;
                  }}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Advance to {flow[Math.min(flow.length - 1, currentStepIndex + 1)]?.label}
                </Button>
                <Button to={paths.app.pharmacyVerify} size="sm" variant="outline">
                  Verification Desk
                </Button>
              </div>
            ) : null}
          </Card>

          {/* Patient Card */}
          <Card>
            <h2 className="text-sm font-semibold text-ink-900 border-b border-slate-100 pb-3">Patient Demographics</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand-700">
                {rx.patientName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-ink-900">{rx.patientName}</p>
                <p className="text-xs text-ink-500 font-mono">ID: {rx.patientId}</p>
              </div>
            </div>
            {rx.dob && (
              <p className="mt-3 text-xs text-ink-500 border-t border-slate-100 pt-2">
                Date of Birth: <span className="font-medium text-ink-800">{rx.dob}</span>
              </p>
            )}
          </Card>

          {/* Pharmacy Info */}
          <Card>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-ink-900">Dispensing Facility</h2>
            </div>
            <p className="mt-3 text-xs font-semibold text-ink-900">{pharmacyOrg.name}</p>
            <p className="text-xs text-ink-500">{pharmacyOrg.address}</p>
            <div className="mt-3 flex justify-between text-[11px] text-ink-400 border-t border-slate-100 pt-2">
              <span>NCPDP: {pharmacyOrg.ncpdp}</span>
              <span>License: {pharmacyOrg.license}</span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
