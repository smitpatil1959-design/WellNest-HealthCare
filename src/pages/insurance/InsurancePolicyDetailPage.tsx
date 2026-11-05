import { useParams } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';

export default function InsurancePolicyDetailPage() {
  const { policyId } = useParams();
  const { policies, claims } = useInsurancePortal();
  const policy = policies.find((p) => p.id === policyId);
  if (!policy) return <EmptyState title="Policy not found" description="That ID is not on this book." />;
  const history = claims.filter((c) => c.policyId === policy.id);

  return (
    <>
      <Seo title={policy.policyId} description={policy.memberName} />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl text-ink-900">{policy.memberName}</h1>
        <Badge>{policy.status}</Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-ink-900">Coverage</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Policy" value={policy.policyId} />
            <Row label="Plan" value={policy.plan} />
            <Row label="Period" value={`${policy.effective} → ${policy.expires}`} />
            <Row label="Deductible" value={`${policy.deductibleMet} of ${policy.deductible}`} />
            <Row label="Copay" value={policy.copay} />
          </dl>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink-900">Covered services</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {policy.coverage.map((c) => (
              <li key={c.service} className="flex justify-between gap-3">
                <span>{c.service}</span>
                <span className="text-ink-400">{c.remaining}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink-900">Dependents</h2>
          {policy.dependents.length === 0 ? <p className="mt-2 text-sm text-ink-500">None on this contract.</p> : null}
          <ul className="mt-2 text-sm text-ink-600">
            {policy.dependents.map((d) => (
              <li key={d.name}>
                {d.name} · {d.relation} · {d.dob}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink-900">Claims on this policy</h2>
          <ul className="mt-2 space-y-1 text-sm text-ink-600">
            {history.map((c) => (
              <li key={c.id}>
                {c.claimId} · {c.service} · {c.status}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-ink-700">
      <dt className="text-ink-400">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
