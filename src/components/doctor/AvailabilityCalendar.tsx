import {useState} from 'react';
import {useAuthenticatedApi} from '../../hooks/useAuthenticatedApi';
import {useAuth} from '../../providers/AuthProvider';
import {safeApiFetch} from '../../utils/apiFetch';
import {Card} from '../ui/Card';
import {Input} from '../ui/Input';
import {Button} from '../ui/Button';
import {Alert} from '../ui/Alert';

export type Availability = {enabled:boolean;timezone:string|null;slots:{id:string;starts_at:string;ends_at:string;timezone:string;booked:boolean}[]};
export function slotLabel(slot:Availability['slots'][number]) {return `${new Date(slot.starts_at).toLocaleString(undefined,{timeZone:slot.timezone,dateStyle:'medium',timeStyle:'short'})} · ${slot.timezone}`;}
export function AvailabilityCalendar(){
  const {session}=useAuth();const query=useAuthenticatedApi<Availability>('/api/availability');
  const [open,setOpen]=useState(false);const [start,setStart]=useState('');const [duration,setDuration]=useState(30);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;
  const save=async(body:unknown,method='POST')=>{
    if(busy)return;setBusy(true);setError('');
    const result=await safeApiFetch('/api/availability',{method,headers:{Authorization:`Bearer ${session?.access_token||''}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!result.ok)setError(result.error);else{await query.refetch();setStart('');}setBusy(false);
  };
  return <Card className="mb-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl">Your availability calendar</h2><p className="mt-2 text-xs text-ink-500">Publish appointment slots for patients to reserve. New times use {timezone}.</p></div><Button size="sm" variant="outline" onClick={()=>setOpen(!open)}>{open?'Hide calendar':'Manage availability'}</Button></div>
    {open&&<div className="mt-5">{(error||query.error)&&<Alert tone="error" title="Calendar needs attention" className="mb-4">{error||query.error?.message}</Alert>}
      <form className="grid items-end gap-3 sm:grid-cols-3" onSubmit={event=>{event.preventDefault();const date=new Date(start);if(!Number.isFinite(date.getTime())){setError('Choose a valid start time.');return;}void save({startsAt:date.toISOString(),endsAt:new Date(date.getTime()+duration*60000).toISOString(),timezone});}}><Input required label="Slot starts" type="datetime-local" value={start} onChange={event=>setStart(event.target.value)}/><Input required label="Duration in minutes" type="number" min={15} max={240} step={15} value={duration} onChange={event=>setDuration(Number(event.target.value))}/><Button type="submit" loading={busy}>Publish slot</Button></form>
      {query.isLoading&&<p role="status" className="mt-4 text-sm">Loading calendar…</p>}
      <div className="mt-5 space-y-3">{query.data?.slots.map(slot=><div key={slot.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3"><div><p className="text-sm font-semibold">{slotLabel(slot)}</p><p className="mt-1 text-xs text-ink-500">{slot.booked?'Reserved':'Available'}</p></div><Button size="sm" variant="outline" disabled={slot.booked||busy} onClick={()=>void save({id:slot.id},'PATCH')}>Close slot</Button></div>)}{query.data&&!query.data.slots.length&&<p className="text-sm text-ink-500">No future slots are published.</p>}</div>
    </div>}
  </Card>;
}
