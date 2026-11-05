import { useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { safeApiFetch } from '../../utils/apiFetch';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { type Availability, slotLabel } from '../doctor/AvailabilityCalendar';

export function AppointmentActions({ id, doctorId, date, time, onSaved }: { id: string; doctorId?: string; date: string; time: string; onSaved: () => Promise<unknown> }) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [nextDate, setDate] = useState(date);
  const [nextTime, setTime] = useState(time);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slotId,setSlotId]=useState('');
  const availability=useAuthenticatedApi<Availability>(`/api/availability?doctorId=${encodeURIComponent(doctorId||'')}`,Boolean(open&&doctorId));
  const save = async (action: 'cancel' | 'reschedule') => {
    if (saving) return; setSaving(true); setError('');
    const result = await safeApiFetch('/api/appointments', { method: 'PATCH', headers: { Authorization: `Bearer ${session?.access_token || ''}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action, date: nextDate, time: nextTime,slotId:availability.data?.enabled?slotId:undefined }) });
    if (!result.ok) setError(result.error);
    else { await onSaved(); setOpen(false); setCanceling(false); }
    setSaving(false);
  };
  return <div className="mt-2 max-w-64 whitespace-normal">
    <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={saving} onClick={() => { setOpen(!open); setCanceling(false); }}>Reschedule</Button><Button size="sm" variant="ghost" disabled={saving} onClick={() => { setCanceling(!canceling); setOpen(false); }}>Cancel visit</Button></div>
    {canceling && <div className="mt-2 rounded-lg bg-rose-50 p-3"><p className="mb-2 text-xs">Cancel this appointment?</p><Button size="sm" variant="danger" loading={saving} onClick={() => void save('cancel')}>Yes, cancel visit</Button></div>}
    {open && <form className="mt-3 grid gap-2" onSubmit={e => { e.preventDefault(); void save('reschedule'); }}>{availability.data?.enabled?<Select required label="New available time" value={slotId} onChange={event=>setSlotId(event.target.value)} options={[{value:'',label:'Choose a time'},...availability.data.slots.map(slot=>({value:slot.id,label:slotLabel(slot)}))]}/>:<><Input required label="New date" type="date" min={new Date().toISOString().slice(0, 10)} value={nextDate} onChange={e => setDate(e.target.value)} /><Input required label="New time" type="time" value={nextTime} onChange={e => setTime(e.target.value)} /></>}<Button type="submit" size="sm" loading={saving} disabled={Boolean(doctorId&&(availability.isLoading||availability.isError))}>Save new time</Button>{availability.error&&doctorId&&<p role="alert" className="text-xs text-rose-700">{availability.error.message}</p>}</form>}
    {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
  </div>;
}
