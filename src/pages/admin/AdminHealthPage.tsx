import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import {IntegrationStatus} from '../../components/organization/IntegrationStatus';

type Health = { checkedAt: string; services: {name:string;status:string;latency:string}[] };
export default function AdminHealthPage() {
  const query=useAuthenticatedApi<Health>('/api/admin/health');
  return <><Seo title="System health" description="Current application data availability checks." /><PatientPageHeader title="System health" description="Live checks of the data services used by WellNest. These checks measure current availability, rather than historical uptime." action={<Button size="sm" variant="outline" loading={query.isFetching} onClick={()=>void query.refetch()}>Run checks</Button>} />
    {query.isLoading && <p role="status" className="mb-5 text-sm">Checking services…</p>}
    {query.error && <Alert tone="error" title="Checks unavailable">{query.error.message}</Alert>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{query.data?.services.map(service=><Card key={service.name}><div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{service.name}</h2><Badge tone={service.status==='operational'?'emerald':'rose'}>{service.status==='operational'?'Available':'Unavailable'}</Badge></div><p className="mt-5 text-sm text-ink-500">Response: {service.latency}</p></Card>)}</div>
    {query.data && <p className="mt-5 text-xs text-ink-500">Checked {new Date(query.data.checkedAt).toLocaleString()}. Backup recovery and external alert delivery are not measured by these checks.</p>}
    <IntegrationStatus />
  </>;
}
