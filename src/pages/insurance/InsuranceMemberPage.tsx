import { useParams } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import { insurerOrg } from '../../constants/insuranceData';
import { paths } from '../../routes/paths';
import { Link } from 'react-router-dom';

export default function InsuranceMemberPage() {
  const { memberId } = useParams();
  const { policies, claims } = useInsurancePortal();
  const policy = policies.find((p) => p.id === memberId);
  if (!policy) return <EmptyState title="Member not found" description="No authorized policy for that ID." />;
  const history = claims.filter((c) => c.policyId === policy.id);

  return (
    <>
      <Seo title={policy.memberName} description="Insurance-authorized member profile." />
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={policy.memberName} src={policy.avatar} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl text-ink-900">{policy.memberName}</h1>
              <Badge>{policy.status}</Badge>
            </div>
            <p className="text-sm text-ink-500">
              {insurerOrg.name} · {policy.policyId} · {policy.plan}
            </p>
            <p className="mt-2 text-xs text-ink-400">This view is coverage-only. Clinical notes stay on the consented clinical chart.</p>
          </div>
        </div>
      </section>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-ink-900">Coverage period</h2>
          <p className="mt-2 text-sm text-ink-600">
            {policy.effective} → {policy.expires}
          </p>
          <p className="mt-2 text-sm text-ink-600">Deductible {policy.deductibleMet} of {policy.deductible}</p>
          <p className="text-sm text-ink-600">{policy.copay}</p>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink-900">Remaining benefits</h2>
          <ul className="mt-2 space-y-1 text-sm text-ink-600">
            {policy.coverage.map((c) => (
              <li key={c.service}>
                {c.service}: {c.remaining}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink-900">Dependents</h2>
          <ul className="mt-2 text-sm text-ink-600">
            {policy.dependents.length === 0 ? <li>None</li> : policy.dependents.map((d) => <li key={d.name}>{d.name}</li>)}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink-900">Claims history</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {history.map((c) => (
              <li key={c.id}>
                <Link to={paths.app.insuranceClaim(c.id)} className="font-medium text-brand-700">
                  {c.claimId}
                </Link>{' '}
                · {c.status} · ${c.amount}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
