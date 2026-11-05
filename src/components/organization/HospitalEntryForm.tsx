import { useState } from 'react';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export function HospitalEntryForm({ kind }: { kind: 'admissions' | 'appointments' | 'labs' }) {
  const portal = useHospitalPortal();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patientId: '', doctorId: '', departmentId: '', room: '', bed: '', date: '', time: '', reason: '', test: '' });
  const label = kind === 'admissions' ? 'Admit patient' : kind === 'labs' ? 'Request hospital test' : 'Schedule hospital visit';
  if (!portal.can(kind)) return null;
  return <div className="mb-6"><Button size="sm" variant="outline" onClick={() => setOpen(!open)}>{open ? 'Close form' : label}</Button>
    {open && <Card className="mt-4"><form className="grid gap-4 sm:grid-cols-2" onSubmit={async event => {
      event.preventDefault(); if (saving) return; setSaving(true);
      try {
        const saved = kind === 'admissions' ? await portal.updateAdmission({ id: '', patientId: form.patientId, doctorId: form.doctorId, departmentId: form.departmentId, room: form.room, bed: form.bed, admitted: form.date, expected: '', status: 'admitted', reason: form.reason })
          : kind === 'labs' ? await portal.addLab({ patientId: form.patientId, doctorId: form.doctorId, test: form.test, status: 'requested', requested: form.date })
          : await portal.addAppointment({ patientId: form.patientId, doctorId: form.doctorId, departmentId: form.departmentId, date: form.date, time: form.time, status: 'upcoming', reason: form.reason });
        if (saved) setOpen(false);
      } finally { setSaving(false); }
    }}>
      <Select required label="Patient chart" value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} options={[{ value: '', label: 'Choose patient' }, ...portal.patients.map(row => ({ value: row.id, label: `${row.name} · ${row.mrn}` }))]} />
      <Select required={kind === 'appointments'} label="Hospital clinician" value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} options={[{ value: '', label: 'Choose clinician' }, ...portal.doctors.filter(row => row.status === 'active').map(row => ({ value: row.id, label: row.name }))]} />
      <Input required label={kind === 'admissions' ? 'Admission date' : 'Date'} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      {kind !== 'labs' && <Select label="Department" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} options={[{ value: '', label: 'Choose department' }, ...portal.depts.map(row => ({ value: row.id, label: row.name }))]} />}
      {kind === 'admissions' && <><Input required label="Room / ward" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /><Input required label="Bed" value={form.bed} onChange={e => setForm({ ...form, bed: e.target.value })} /></>}
      {kind === 'appointments' && <Input required label="Time" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />}
      {kind === 'labs' ? <Input required label="Requested test" value={form.test} onChange={e => setForm({ ...form, test: e.target.value })} /> : <Input label="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />}
      <div className="sm:col-span-2"><Button type="submit" loading={saving}>{label}</Button></div>
    </form></Card>}
  </div>;
}
