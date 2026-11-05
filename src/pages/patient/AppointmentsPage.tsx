import { useState, type FormEvent } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  PlusCircle,
  Building2,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Activity,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { cn } from '../../utils/cn';
import type { AppointmentStatus } from '../../types/patient';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { safeApiFetch } from '../../utils/apiFetch';
import { Alert } from '../../components/ui/Alert';
import { formatDate } from '../../utils/format';
import { AppointmentActions } from '../../components/patient/AppointmentActions';
import {type Availability,slotLabel} from '../../components/doctor/AvailabilityCalendar';

const tabs: { id: AppointmentStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All Consultations' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'canceled', label: 'Canceled' },
];

const statusTones: Record<AppointmentStatus, 'brand' | 'emerald' | 'rose'> = {
  upcoming: 'brand',
  completed: 'emerald',
  canceled: 'rose',
};

interface AppointmentRow {
  id: string;
  doctor_id?: string;
  timezone?: string;
  title: string;
  doctor: string;
  hospital: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  reason: string;
}

interface DoctorOption {
  id: string;
  full_name: string;
  organization: string | null;
  specialty: string | null;
}

export default function AppointmentsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('upcoming');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const { session } = useAuth();
  const { push } = useToast();
  const query = useAuthenticatedApi<AppointmentRow[]>('/api/appointments');
  const doctorsQuery = useAuthenticatedApi<DoctorOption[]>('/api/doctors');

  const [doctorId, setDoctorId] = useState('');
  const [slotId,setSlotId]=useState('');
  const availability=useAuthenticatedApi<Availability>(`/api/availability?doctorId=${encodeURIComponent(doctorId)}`,Boolean(doctorId));
  const [title, setTitle] = useState('Consultation');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [booking, setBooking] = useState(false);
  const [actionError, setActionError] = useState('');

  const allAppointments = query.data ?? [];
  const upcomingCount = allAppointments.filter((a) => a.status === 'upcoming').length;
  const completedCount = allAppointments.filter((a) => a.status === 'completed').length;
  const canceledCount = allAppointments.filter((a) => a.status === 'canceled').length;

  const rows = allAppointments.filter((item) => tab === 'all' || item.status === tab);

  const bookAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.access_token) return setActionError('Your authenticated session is not ready.');
    setBooking(true);
    setActionError('');
    const result = await safeApiFetch<AppointmentRow>('/api/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId, title, reason, date, time, slotId:availability.data?.enabled?slotId:undefined }),
    });
    if (!result.ok) {
      setActionError(result.error);
    } else {
      push({ tone: 'success', title: 'Appointment requested successfully' });
      setReason('');
      setShowRequestForm(false);
      await query.refetch();
    }
    setBooking(false);
  };

  const doctorOptions = [
    { value: '', label: 'Select a verified doctor' },
    ...(doctorsQuery.data ?? []).map((doctor) => ({
      value: doctor.id,
      label: `${doctor.full_name}${doctor.specialty ? ` (${doctor.specialty})` : ''}`,
    })),
  ];

  return (
    <>
      <Seo title="Appointments" description="Upcoming and past clinical consultations." />
      <PatientPageHeader
        eyebrow="Clinical Schedule"
        title="Appointments"
        description="Schedule and track clinical visits, outpatient consultations, and follow-ups with verified practitioners."
        action={
          <Button
            size="sm"
            leftIcon={showRequestForm ? <ChevronUp className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
            onClick={() => setShowRequestForm(!showRequestForm)}
          >
            {showRequestForm ? 'Close Form' : 'Request Appointment'}
          </Button>
        }
      />

      {/* Metrics Stat Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Upcoming Visits</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-700">{upcomingCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Past Consultations</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{completedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Canceled / Inactive</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{canceledCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Verified Doctors</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{doctorsQuery.data?.length ?? 0}</p>
        </div>
      </div>

      {/* Request Form (Expandable) */}
      {showRequestForm ? (
        <Card className="mb-6 border-brand-200 bg-brand-50/10">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PlusCircle className="h-4 w-4 text-brand-600" />
            <h2 className="font-semibold text-ink-900">Request New Consultation</h2>
          </div>

          {actionError ? (
            <Alert tone="error" title="Could not request appointment" className="mt-4">
              {actionError}
            </Alert>
          ) : null}

          <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={bookAppointment}>
            <div className="sm:col-span-2">
              <Select
                label="Verified Doctor"
                required
                value={doctorId}
                onChange={(e) => {setDoctorId(e.target.value);setSlotId('');}}
                options={doctorOptions}
              />
            </div>
            <Input
              label="Consultation Title / Type"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Annual Checkup, Cardiology Review"
              maxLength={120}
            />
            {availability.error&&doctorId&&<Alert tone="error" title="Doctor calendar unavailable">{availability.error.message}</Alert>}
            {availability.data?.enabled?<Select required label="Available appointment" value={slotId} onChange={event=>setSlotId(event.target.value)} options={[{value:'',label:'Choose an available time'},...availability.data.slots.map(slot=>({value:slot.id,label:slotLabel(slot)}))]}/>:<><Input
              label="Preferred Date"
              required
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <Input
              label="Preferred Time"
              required
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
            </>}
            <Input
              label="Chief Complaint / Reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Brief description of symptoms or consultation goal"
              maxLength={500}
            />
            <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowRequestForm(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={booking}
                disabled={doctorsQuery.isLoading || (doctorsQuery.data ?? []).length === 0 || availability.isLoading || Boolean(doctorId&&availability.isError)}
              >
                Submit Request
              </Button>
            </div>
          </form>

          {doctorsQuery.isError ? (
            <p className="mt-3 text-xs text-rose-600 font-medium">
              Doctor directory: {doctorsQuery.error instanceof Error ? doctorsQuery.error.message : 'Unavailable'}
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* Pill Tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
              tab === item.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Appointment Table / Cards */}
      <AuthenticatedApiState loading={query.isLoading} error={query.error} retry={() => { void query.refetch(); }}>
        {rows.length === 0 ? (
          <EmptyState
            title="No appointments scheduled"
            description="No visits found for the selected status. Click 'Request Appointment' above to book a consultation."
            icon={Calendar}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Consultation Details</th>
                    <th className="px-4 py-3">Practitioner & Facility</th>
                    <th className="px-4 py-3">Scheduled Time</th>
                    <th className="px-4 py-3">Clinical Notes</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-ink-800">
                  {rows.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-brand-700 border border-teal-100">
                            <Stethoscope className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">{item.title}</p>
                            <p className="text-[11px] text-ink-400">ID: {item.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs">
                        <p className="font-semibold text-ink-900">{item.doctor || 'Clinician unassigned'}</p>
                        <p className="text-ink-500">{item.hospital || 'Outpatient Clinic'}</p>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs font-medium text-ink-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-brand-600" />
                          <span>{formatDate(item.date)}</span>
                        </div>
                        {item.time ? (
                          <div className="flex items-center gap-1.5 mt-0.5 text-ink-500">
                            <Clock className="h-3 w-3 text-ink-400" />
                            <span>{item.time}</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs text-ink-600 max-w-xs truncate">
                        {item.reason || <span className="text-ink-300 italic">No notes provided</span>}
                      </td>
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <Badge tone={statusTones[item.status] || 'slate'} className="capitalize">
                          {item.status}
                        </Badge>
                        {item.status === 'upcoming' && <AppointmentActions id={item.id} doctorId={item.doctor_id} date={item.date} time={item.time || ''} onSaved={query.refetch} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AuthenticatedApiState>
    </>
  );
}
