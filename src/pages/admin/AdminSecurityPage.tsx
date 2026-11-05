import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAdminPortal } from '../../hooks/useAdminPortal';
import { paths } from '../../routes/paths';
import { formatDate } from '../../utils/format';

export default function AdminSecurityPage() {
  const {users,audit}=useAdminPortal();
  const events=audit.filter(event=>event.result==='denied'||event.action==='account_status_changed');
  return <><Seo title="Account security" description="Account restrictions and recorded security events."/><PatientPageHeader title="Account security" description="Review saved account restrictions and security-related audit events. External threat detection is not connected to this view." action={<Button to={paths.app.adminUsers} size="sm" variant="outline">Manage accounts</Button>}/>
    <div className="mb-5 grid gap-4 sm:grid-cols-2"><Card><p className="text-sm text-ink-500">Suspended accounts</p><p className="mt-3 font-display text-4xl">{users.filter(user=>user.status==='suspended').length}</p></Card><Card><p className="text-sm text-ink-500">Recent restriction and denial events</p><p className="mt-3 font-display text-4xl">{events.length}</p></Card></div>
    <Card><h2 className="font-display text-2xl">Recorded security activity</h2><div className="mt-5 space-y-3">{events.map(event=><div key={event.id} className="flex flex-wrap justify-between gap-2 border-b border-line pb-3 text-sm"><span>{event.action.replaceAll('_',' ')}</span><span className="text-xs text-ink-500">{formatDate(event.at)} · {event.result}</span></div>)}{!events.length&&<p className="text-sm text-ink-500">No matching events were found in the latest 500 audit entries.</p>}</div><Button to={paths.app.adminAudit} size="sm" variant="outline" className="mt-5">Review audit log</Button></Card>
  </>;
}
