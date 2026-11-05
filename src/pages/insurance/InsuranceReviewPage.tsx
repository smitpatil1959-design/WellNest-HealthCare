import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck2,
  DollarSign,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import { paths } from '../../routes/paths';
import { useToast } from '../../providers/ToastProvider';
import { fadeUp, stagger } from '../../animations/variants';

export default function InsuranceReviewPage() {
  const { claims, setClaimStatus, can } = useInsurancePortal();
  const { push } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const queue = claims.filter(
    (c) => c.status === 'new' || c.status === 'review' || c.status === 'documents'
  );

  const totalValue = queue.reduce((acc, c) => acc + (c.amount || 0), 0);
  const queueDocuments = queue.flatMap((claim) => claim.documents);
  const verifiedDocumentCount = queueDocuments.filter((document) => document.verified).length;

  const filteredQueue = useMemo(() => {
    return claims.filter((c) => c.status === 'new' || c.status === 'review' || c.status === 'documents').filter((c) =>
      `${c.claimId} ${c.memberName} ${c.service} ${c.hospital}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [claims, searchTerm]);

  if (!can('review') && !can('all')) {
    return (
      <EmptyState
        title="Claims Adjudicator Licensure Required"
        description="Claim approval and reimbursement authorization is restricted to credentialed medical claims reviewers."
      />
    );
  }

  return (
    <>
      <Seo
        title="Claims Adjudication & Clinical Review — Insurance Command"
        description="Review submitted hospital claims, inspect clinical evidence, and adjudicate reimbursements."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Adjudication Desk"
          title="Medical Claims Review & Adjudication"
          description="Examine provider billing packets, cross-examine hospital discharge summaries and laboratory findings, and authorize policyholder claim disbursements."
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="In Review Queue"
            value={queue.length}
            icon={Clock}
            subtext="Awaiting adjudication"
          />
          <StatTile
            label="Value at Risk"
            value={`$${totalValue.toLocaleString()}`}
            icon={DollarSign}
            subtext="Total claimed amount"
          />
          <StatTile
            label="Clinical Evidence"
            value={`${verifiedDocumentCount}/${queueDocuments.length}`}
            icon={ShieldCheck}
            subtext="Verified documents in review queue"
          />
          <StatTile
            label="Flagged claims"
            value={queue.filter((claim) => claim.flags.length > 0).length}
            icon={CheckCircle2}
            subtext="Require additional review"
          />
        </motion.div>

        {/* Search Toolbar */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Search claims by ID, member name, hospital, or clinical procedure..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-ink-400" />}
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Reset search
            </button>
          )}
        </motion.div>

        {/* Claims Review Worklist */}
        <motion.div variants={fadeUp} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink-900">
              Active Review Docket ({filteredQueue.length})
            </h3>
            <span className="text-xs text-ink-400">Strict medical necessity criteria</span>
          </div>

          {filteredQueue.length === 0 ? (
            <EmptyState
              title={queue.length === 0 ? 'Review Queue Clear' : 'No matching claims'}
              description={
                queue.length === 0
                  ? 'All incoming healthcare claims have been successfully adjudicated, approved, or settled.'
                  : `No claims matched "${searchTerm}".`
              }
            />
          ) : (
            filteredQueue.map((c) => {
              const hasFlags = c.flags && c.flags.length > 0;
              return (
                <Card key={c.id} hover className="transition-all">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                          hasFlags
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-brand-200 bg-brand-50 text-brand-700'
                        }`}
                      >
                        <FileCheck2 className="h-5 w-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-ink-900">{c.claimId}</h4>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-ink-700">
                            {c.service}
                          </span>
                          <span className="text-sm font-bold text-brand-900">
                            ${c.amount.toLocaleString()}
                          </span>
                          <Badge
                            tone={c.status === 'review' ? 'sky' : 'amber'}
                            className="capitalize text-[10px]"
                          >
                            {c.status}
                          </Badge>
                          {hasFlags && (
                            <Badge tone="amber" className="text-[10px]">
                              Anomaly Flagged
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-ink-600">
                          Policyholder: <strong className="text-ink-900">{c.memberName}</strong> · Billing Facility: {c.hospital} · Submitted: {c.submitted}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-400 pt-0.5">
                          <span>{c.documents.length} Clinical Documents Attached</span>
                          {hasFlags && (
                            <span className="font-semibold text-amber-800">
                              Flags: {c.flags.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
                      <Button
                        to={paths.app.insuranceClaim(c.id)}
                        size="sm"
                        variant="outline"
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                      >
                        Inspect Dossier
                      </Button>

                      <Button
                        size="sm"
                        onClick={async () => {
                          if (
                            window.confirm(
                              `Authorize claim ${c.claimId} for $${c.amount.toLocaleString()} to ${c.hospital}?`
                            )
                          ) {
                            if (!(await setClaimStatus(c.id, 'approved', 'Approved by clinical reviewer.'))) return;
                            push({ tone: 'success', title: 'Claim approved & authorized' });
                          }
                        }}
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      >
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          const reason = window.prompt('Denial reason:', 'Service not covered under active benefit schedule.');
                          if (reason) {
                            if (!(await setClaimStatus(c.id, 'rejected', reason))) return;
                            push({ tone: 'error', title: 'Claim denied', description: reason });
                          }
                        }}
                        leftIcon={<XCircle className="h-3.5 w-3.5" />}
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </motion.div>
      </motion.div>
    </>
  );
}

function StatTile({
  label,
  value,
  subtext,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  subtext: string;
  icon: typeof FileCheck2;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-ink-400">{subtext}</p>
    </div>
  );
}
