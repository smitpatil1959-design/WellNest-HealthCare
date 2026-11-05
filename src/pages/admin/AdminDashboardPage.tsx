import { Users, Building2, ShieldCheck, Activity } from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PortalHeroBanner } from '../../components/ui/PortalHeroBanner';
import { StatMetricCard } from '../../components/ui/StatMetricCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAdminPortal } from '../../hooks/useAdminPortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';

export default function AdminDashboardPage() {
  const { users, orgs, pendingApplications, audit } = useAdminPortal();
  return <>
    <Seo title="Administration" description="Manage WellNest accounts, organizations and verification." />
    <PortalHeroBanner roleLabel="Platform administration" title="Connected care starts with trust." description="Review real account activity, approve professional applications and oversee your healthcare organizations." actions={<><Button to={paths.app.adminVerification} size="sm">Review applications ({pendingApplications.length})</Button><Button to={paths.app.adminUsers} size="sm" variant="outline">Manage accounts</Button></>} />
    <div className="my-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatMetricCard label="Registered accounts" value={users.length} icon={Users} detail={`${users.filter(user => user.role === 'patient').length} patients`} />
      <StatMetricCard label="Organizations" value={orgs.length} icon={Building2} detail={`${orgs.filter(org => org.status === 'verified').length} verified`} />
      <StatMetricCard label="Pending applications" value={pendingApplications.length} icon={ShieldCheck} detail="Awaiting professional review" />
      <StatMetricCard label="Recent audit events" value={audit.length} icon={Activity} detail="Latest 500 recorded events" />
    </div>
    <div className="grid gap-5 lg:grid-cols-2"><Card><h2 className="font-display text-2xl text-ink-900">Your healthcare network</h2><div className="mt-5 space-y-4">{['hospital', 'laboratory', 'pharmacy', 'insurance'].map(kind => <div key={kind} className="flex justify-between border-b border-line pb-3 text-sm"><span className="capitalize">{kind}</span><strong>{orgs.filter(org => org.kind === kind).length}</strong></div>)}</div><Button to={paths.app.adminOrganizations} size="sm" variant="outline" className="mt-5">View organizations</Button></Card>
      <Card><h2 className="font-display text-2xl text-ink-900">Latest recorded activity</h2><div className="mt-5 space-y-4">{audit.slice(0,5).map(event => <div key={event.id} className="border-b border-line pb-3"><p className="text-sm font-semibold">{event.action.replaceAll('_',' ')}</p><p className="mt-1 text-xs text-ink-500">{formatDate(event.at)} · {event.result}</p></div>)}{!audit.length && <p className="text-sm text-ink-500">No audit events are available yet.</p>}</div><Button to={paths.app.adminAudit} size="sm" variant="outline" className="mt-5">Open audit log</Button></Card></div>
  </>;
}
