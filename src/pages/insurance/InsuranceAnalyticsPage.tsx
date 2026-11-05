import { AlertTriangle, CheckCircle2, Clock3, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Sparkline } from '../../components/ui/Sparkline';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import { paths } from '../../routes/paths';
import type { ClaimStatus } from '../../types/insurance';

const claimStatuses: { key: ClaimStatus; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'documents', label: 'Documents needed' },
  { key: 'review', label: 'In review' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
  { key: 'rejected', label: 'Rejected' },
];

export default function InsuranceAnalyticsPage() {
  const { claims, policies } = useInsurancePortal();
  const openClaims = claims.filter((claim) => claim.status === 'new' || claim.status === 'documents' || claim.status === 'review');
  const resolvedClaims = claims.filter((claim) => claim.status === 'approved' || claim.status === 'paid' || claim.status === 'rejected');
  const approvedClaims = claims.filter((claim) => claim.status === 'approved' || claim.status === 'paid');
  const flaggedClaims = claims.filter((claim) => claim.flags.length > 0);
  const claimedAmount = claims.reduce((total, claim) => total + claim.amount, 0);
  const paidAmount = claims
    .filter((claim) => claim.status === 'paid')
    .reduce((total, claim) => total + claim.amount, 0);
  const statusCounts = claimStatuses.map(({ key }) => claims.filter((claim) => claim.status === key).length);
  const statusAmounts = claimStatuses.map(({ key }) =>
    claims.filter((claim) => claim.status === key).reduce((total, claim) => total + claim.amount, 0),
  );
  const activePolicies = policies.filter((policy) => policy.status === 'active').length;
  const approvalRate = resolvedClaims.length
    ? Math.round((approvedClaims.length / resolvedClaims.length) * 100)
    : 0;

  return (
    <>
      <Seo title="Claims analytics" description="Current insurance claim, policy, and review workload." />
      <PatientPageHeader
        eyebrow="Health plan operations"
        title="Claims & policy analytics"
        description="Review current claim volumes, adjudication outcomes, outstanding exposure, and policy enrollment using the records available to your health plan."
      />

      <section aria-label="Insurance metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Claims received" value={claims.length} detail="Claims in the current workspace" icon={FileText} />
        <MetricCard label="Open review queue" value={openClaims.length} detail="New, incomplete, or under review" icon={Clock3} tone="amber" />
        <MetricCard label="Active policies" value={activePolicies} detail={`${policies.length} policy records`} icon={CheckCircle2} tone="emerald" />
        <MetricCard label="Flagged for review" value={flaggedClaims.length} detail="Claims with review flags" icon={AlertTriangle} tone="amber" />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Claim workload</p>
              <h2 className="mt-1 text-base font-semibold text-ink-900">Claims by current status</h2>
            </div>
            <Badge tone="slate">{claims.length} records</Badge>
          </div>
          <Sparkline className="mt-5 h-16 w-full" points={statusCounts} />
          <div className="mt-4 divide-y divide-slate-100">
            {claimStatuses.map(({ key, label }, index) => {
              const count = statusCounts[index];
              return (
                <div key={key} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink-600">{label}</span>
                  <span className="font-semibold tabular-nums text-ink-900">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Financial overview</p>
              <h2 className="mt-1 text-base font-semibold text-ink-900">Claimed and paid amounts</h2>
            </div>
            <Badge tone="brand">{approvalRate}% approved of resolved</Badge>
          </div>
          <Sparkline className="mt-5 h-16 w-full" points={statusAmounts} color="#059669" />
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Claimed amount in workspace</span>
              <strong className="tabular-nums text-ink-900">${claimedAmount.toLocaleString()}</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Marked paid</span>
              <strong className="tabular-nums text-emerald-700">${paidAmount.toLocaleString()}</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Awaiting decision</span>
              <strong className="tabular-nums text-amber-700">${openClaims.reduce((total, claim) => total + claim.amount, 0).toLocaleString()}</strong>
            </div>
          </div>
        </Card>
      </section>

      <Card className="mt-5" padded={false}>
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-900">Claims requiring attention</h2>
            <p className="mt-1 text-sm text-ink-500">Open or flagged claims from the current workspace.</p>
          </div>
          <Link to={paths.app.insuranceReview} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Open review queue
          </Link>
        </div>
        {openClaims.length === 0 && flaggedClaims.length === 0 ? (
          <p className="p-5 text-sm text-ink-500">No open or flagged claims are available.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {[...new Map([...openClaims, ...flaggedClaims].map((claim) => [claim.id, claim])).values()].slice(0, 6).map((claim) => (
              <li key={claim.id}>
                <Link
                  to={paths.app.insuranceClaim(claim.id)}
                  className="flex flex-col gap-2 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">{claim.claimId} · {claim.memberName}</span>
                    <span className="mt-0.5 block text-xs text-ink-500">{claim.service} · Submitted {claim.submitted}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone={claim.flags.length ? 'amber' : 'slate'}>{claim.flags.length ? 'Flagged' : claim.status.replace('-', ' ')}</Badge>
                    <span className="text-sm font-semibold tabular-nums text-ink-800">${claim.amount.toLocaleString()}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'brand',
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof FileText;
  tone?: 'brand' | 'amber' | 'emerald';
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl text-ink-900">{value}</p>
      <p className="mt-1 text-xs text-ink-500">{detail}</p>
    </Card>
  );
}
