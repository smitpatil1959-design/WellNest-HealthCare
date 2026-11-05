import {useState} from 'react';
import {useAuthenticatedApi} from '../../hooks/useAuthenticatedApi';
import {useAuth} from '../../providers/AuthProvider';
import {safeApiFetch} from '../../utils/apiFetch';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {Badge} from '../ui/Badge';
import {Alert} from '../ui/Alert';
type Status={email:boolean;sms:boolean;scanner:boolean;scheduler:boolean;enabled:boolean;jobs:{id:string;channel:string;kind:string;status:string;last_error:string|null}[]};
export function IntegrationStatus(){
  const {session}=useAuth();const query=useAuthenticatedApi<Status>('/api/admin/integrations');const [busy,setBusy]=useState('');const [message,setMessage]=useState('');
  const test=async(channel:string)=>{if(busy)return;setBusy(channel);setMessage('');const result=await safeApiFetch<{message:string}>('/api/admin/integrations',{method:'POST',headers:{Authorization:`Bearer ${session?.access_token||''}`,'Content-Type':'application/json'},body:JSON.stringify({channel})});setMessage(result.ok?result.data.message:result.error);setBusy('');};
  return <Card className="mt-6"><h2 className="font-display text-2xl">Reminders & file scanning</h2><p className="mt-2 text-xs leading-6 text-ink-500">Provider configuration is shown separately from message receipt. Accepted messages still need delivery confirmation.</p>{query.error&&<Alert tone="error" title="Integration status unavailable" className="mt-4">{query.error.message}</Alert>}{message&&<p role="status" className="mt-4 text-sm">{message}</p>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2">{(['email','sms','scanner','scheduler']as const).map(name=><div key={name} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"><span className="text-sm capitalize">{name==='scheduler'?'Scheduler credential':name==='scanner'?'Private file scanner':name}</span><Badge tone={query.data?.[name]?'emerald':'amber'}>{query.data?.[name]?'Configured':'Setup needed'}</Badge></div>)}</div>
    <p className="mt-4 text-xs text-ink-500">Automated delivery: {query.data?.enabled?'Activated':'Not activated'}. A scheduled worker must also be configured.</p>
    <div className="mt-4 flex flex-wrap gap-3"><Button size="sm" variant="outline" disabled={!query.data?.email||Boolean(busy)} onClick={()=>void test('email')}>Send test to my verified email</Button><Button size="sm" variant="outline" disabled={!query.data?.sms||Boolean(busy)} onClick={()=>void test('sms')}>Send test to my verified phone</Button></div>
    <div className="mt-5 space-y-2">{query.data?.jobs.slice(0,10).map(job=><div key={job.id} className="flex flex-wrap justify-between gap-2 border-t border-line py-2 text-xs"><span>{job.channel} · {job.kind.replaceAll('_',' ')}</span><span>{job.status}{job.last_error?` · ${job.last_error}`:''}</span></div>)}</div>
  </Card>;
}
