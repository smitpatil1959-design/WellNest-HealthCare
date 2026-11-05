import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ChevronLeft,
  ShieldCheck,
  Building2,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileCheck2,
  User,
  Send,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { EmptyState } from '../../components/ui/EmptyState';
import { VerificationPill } from '../../components/doctor/VerificationPill';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import { paths } from '../../routes/paths';
import { useToast } from '../../providers/ToastProvider';
import { formatDate } from '../../utils/format';
import type { ClaimDocSource, ClaimStatus } from '../../types/insurance';

const steps: { id: string; label: string; desc: string }[] = [
  { id: 'treatment', label: 'Treatment', desc: 'Clinical service rendered' },
  { id: 'documents', label: 'Documentation', desc: 'EHR packets collected' },
  { id: 'review', label: 'Clinical Review', desc: 'Coverage & medical necessity' },
  { id: 'decision', label: 'Adjudication', desc: 'Approved or denied' },
  { id: 'paid', label: 'Settlement', desc: 'Remittance paid' },
];

const sourceMap: Record<ClaimDocSource, 'hospital' | 'laboratory' | 'doctor' | 'patient'> = {
  hospital: 'hospital',
  laboratory: 'laboratory',
  pharmacy: 'hospital',
  doctor: 'doctor',
  patient: 'patient',
};

export default function InsuranceClaimDetailPage() {
  const { claimId } = useParams();
  const { claims, setClaimStatus, addNote, can } = useInsurancePortal();
  const { push } = useToast();
  const [note, setNote] = useState('');
  const claim = claims.find((c) => c.id === claimId);

  if (!claim) {
    return (
      <EmptyState
        icon={FileText}
        title="Insurance Claim Not Found"
        description="The requested claim file does not exist in this payer's adjudication desk."
      >
        <Button to={paths.app.insuranceClaims} size="sm" variant="outline" className="mt-4" leftIcon={<ChevronLeft className="h-4 w-4" />}>
          Back to Claims
        </Button>
      </EmptyState>
    );
  }

  const reviewer = can('review') || can('all');

  const getStatusTone = (status: string): BadgeTone => {
    switch (status) {
      case 'paid':
      case 'approved':
        return 'emerald';
      case 'review':
      case 'documents':
        return 'sky';
      case 'new':
        return 'amber';
      case 'rejected':
        return 'rose';
      default:
        return 'slate';
    }
  };

  const getStepIndex = (status: ClaimStatus) => {
    switch (status) {
      case 'new':
        return 0;
      case 'documents':
        return 1;
      case 'review':
        return 2;
      case 'approved':
      case 'rejected':
        return 3;
      case 'paid':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(claim.status);

  return (
    <>
      <Seo title={`${claim.claimId} - Claims Adjudication`} description={claim.service} />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
            <Link to={paths.app.insuranceClaims} className="hover:text-brand-700 transition flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" /> Claims Register
            </Link>
            <span>/</span>
            <span className="font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded">{claim.claimId}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-900 sm:text-3xl">{claim.service}</h1>
          <p className="text-xs text-ink-500">
            Insured Member: <span className="font-semibold text-ink-800">{claim.memberName}</span> · Submitted {formatDate(claim.submitted)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={getStatusTone(claim.status)} className="capitalize text-xs font-semibold">
            {claim.status}
          </Badge>
          {reviewer && claim.status !== 'paid' && claim.status !== 'rejected' && (
            <>
              {claim.status !== 'approved' && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={async () => {
                    if (!(await setClaimStatus(claim.id, 'approved', 'Approved after source-signed clinical document review.'))) return;
                    push({
                      tone: 'success',
                      title: 'Claim Adjudicated & Approved',
                      description: `Claim ${claim.claimId} approved for $${claim.amount.toLocaleString()}.`,
                    });
                  }}
                >
                  Approve Claim
                </Button>
              )}
              {claim.status === 'approved' && (
                <Button
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800"
                  onClick={async () => {
                    if (!(await setClaimStatus(claim.id, 'paid', 'Reviewer recorded paid status.'))) return;
                    push({
                      tone: 'success',
                      title: 'Payment status recorded',
                      description: 'The claim is marked paid. No payment transfer is initiated by this action.',
                    });
                  }}
                >
                  Record paid status
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  if (!(await setClaimStatus(claim.id, 'rejected', 'Claim denied following policy benefits adjudication.'))) return;
                  push({
                    tone: 'warning',
                    title: 'Claim Denied',
                    description: `Denial letter generated and dispatched to member ${claim.memberName}.`,
                  });
                }}
              >
                Deny Claim
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Adjudication Progress Pipeline */}
      <Card className="mb-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Adjudication & Verification Progress
          </h2>
          <span className="font-mono text-xs font-semibold text-brand-700">Stage {currentStep + 1} of 5</span>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {steps.map((s, idx) => {
            const isPassed = idx <= currentStep;
            const isCurrent = idx === currentStep;
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
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols): Clinical Overview, Billing & Documents */}
        <div className="space-y-6 lg:col-span-2">
          {/* Claim Financial Breakdown */}
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-ink-900">Claim Financial & Service Details</h2>
              <span className="font-mono text-lg font-bold text-ink-900">${claim.amount.toLocaleString()}</span>
            </div>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Claim Reference ID</dt>
                <dd className="mt-1 font-mono font-bold text-ink-900 text-sm">{claim.claimId}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Service / Clinical Indication</dt>
                <dd className="mt-1 font-semibold text-ink-900 text-sm">{claim.service}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Rendering Hospital / Facility</dt>
                <dd className="mt-1 font-medium text-ink-900 text-sm">{claim.hospital || 'Memorial Regional Hospital'}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Attending Physician</dt>
                <dd className="mt-1 font-medium text-ink-900 text-sm">Dr. {claim.doctor || 'Licensed Physician'}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Filing Submission Date</dt>
                <dd className="mt-1 font-medium text-ink-900">{formatDate(claim.submitted)}</dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <dt className="text-ink-400 font-medium">Current Status</dt>
                <dd className="mt-1 font-semibold capitalize text-brand-700">{claim.status}</dd>
              </div>
            </dl>

            {claim.flags.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Adjudication Delta Flags:</span>
                </div>
                <p className="mt-1">{claim.flags.join(' · ')}</p>
              </div>
            )}
          </Card>

          {/* Attached Verified Documents */}
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-ink-900">Clinical Supporting Documentation</h2>
              </div>
              <span className="text-xs text-ink-400">{claim.documents.length} verified packets</span>
            </div>

            {claim.documents.length === 0 ? (
              <div className="py-6 text-center text-xs text-ink-500">
                <p>No external document packets attached to this claim file.</p>
                <p className="text-[11px] text-ink-400 mt-1">EHR integration verified through provider electronic billing gateway.</p>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {claim.documents.map((d) => (
                  <li key={d.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-ink-900">{d.title}</span>
                      <span className="block text-[11px] text-ink-400 capitalize">Type: {d.type} · Date: {formatDate(d.date)}</span>
                    </div>
                    <VerificationPill source={sourceMap[d.source]} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right Column: Member Profile & Adjudication Notes */}
        <div className="space-y-6">
          {/* Member & Policy Context */}
          <Card>
            <h2 className="text-sm font-semibold text-ink-900 border-b border-slate-100 pb-3">Insured Member Context</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand-700">
                {claim.memberName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-ink-900">{claim.memberName}</p>
                <p className="text-xs text-ink-500 font-mono">Plan: {claim.policyId || 'Active Plan'}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-400">Coverage Status:</span>
                <Badge tone="emerald" className="text-[10px]">Active In-Force</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Payer Network:</span>
                <span className="font-medium text-ink-800">Tier-1 In-Network</span>
              </div>
            </div>
          </Card>

          {/* Reviewer Adjudication Notes & Thread */}
          <Card>
            <h2 className="text-sm font-semibold text-ink-900 border-b border-slate-100 pb-3">Adjudicator Clinical Notes</h2>
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {claim.notes.length === 0 ? (
                <p className="text-xs text-ink-400">No adjuster notes added yet.</p>
              ) : (
                claim.notes.map((n, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-2.5 text-xs text-ink-700 border border-slate-100">
                    {n}
                  </div>
                ))
              )}
            </div>

            {reviewer && (
              <form
                className="mt-4 space-y-2 border-t border-slate-100 pt-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!note.trim()) return;
                  if (!(await addNote(claim.id, note))) return;
                  setNote('');
                  push({ tone: 'info', title: 'Note Logged', description: 'Internal adjuster note recorded.' });
                }}
              >
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Record clinical justification or audit note..."
                  rows={2}
                />
                <Button type="submit" size="sm" variant="outline" className="w-full text-xs" leftIcon={<Send className="h-3 w-3" />}>
                  Append Clinical Note
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
