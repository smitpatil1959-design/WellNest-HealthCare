import { Bed, CalendarDays, FileCheck2, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Sparkline } from '../../components/ui/Sparkline';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { paths } from '../../routes/paths';
import { seriesByDate } from '../../utils/analytics';

export default function HospitalAnalyticsPage() {
  const { appointments, doctors, reports, admits, depts } = useHospitalPortal();
  const currentAdmissions = admits.filter((admission) => admission.status !== 'discharged');
  const availableDoctors = doctors.filter((doctor) => doctor.status === 'active' && doctor.available);
  const verifiedReports = reports.filter((report) => report.verified);
  const appointmentTrend = seriesByDate(appointments.map((appointment) => appointment.date));
  const admissionTrend = seriesByDate(admits.map((admission) => admission.admitted));
  const reportTrend = seriesByDate(reports.map((report) => report.date));
  const appointmentsByStatus = ['upcoming', 'waiting', 'completed', 'canceled'].map(
    (status) => appointments.filter((appointment) => appointment.status === status).length,
  );
  const admissionsByStatus = ['admitted', 'observation', 'pending-discharge', 'discharged'].map(
    (status) => admits.filter((admission) => admission.status === status).length,
  );

  return (
    <>
      <Seo title="Hospital operations analytics" description="Current hospital appointments, admissions, staffing, and reports." />
      <PatientPageHeader
        eyebrow="Hospital operations"
        title="Hospital operations analytics"
        description="A working summary of appointments, inpatient admissions, clinical staffing, and verified reports from this hospital workspace."
      />

      <section aria-label="Hospital metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current admissions" value={currentAdmissions.length} detail="Patients not yet discharged" icon={Bed} />
        <MetricCard label="Scheduled appointments" value={appointments.length} detail={`${appointments.filter((item) => item.status === 'upcoming').length} upcoming`} icon={CalendarDays} />
        <MetricCard label="Available physicians" value={availableDoctors.length} detail={`${doctors.length} physician records`} icon={Stethoscope} />
        <MetricCard label="Verified reports" value={verifiedReports.length} detail={`${reports.length} reports in workspace`} icon={FileCheck2} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <TrendCard title="Appointments by date" value={appointments.length} points={appointmentTrend} detail="Counts grouped from scheduled appointment dates." />
        <TrendCard title="Admissions by date" value={admits.length} points={admissionTrend} detail="Counts grouped from admission dates." color="#059669" />
        <TrendCard title="Reports by date" value={reports.length} points={reportTrend} detail="Counts grouped from report dates." color="#0284c7" />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <StatusCard title="Appointments" labels={['Upcoming', 'Waiting', 'Completed', 'Canceled']} counts={appointmentsByStatus} link={paths.app.hospitalAppointments} linkLabel="Manage appointments" />
        <StatusCard title="Admissions" labels={['Admitted', 'Observation', 'Pending discharge', 'Discharged']} counts={admissionsByStatus} link={paths.app.hospitalAdmissions} linkLabel="Manage admissions" />
      </section>

      <Card className="mt-5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-ink-900">Departments and care teams</h2>
            <p className="mt-1 text-sm text-ink-500">Staffing and service availability in this hospital workspace.</p>
          </div>
          <Badge tone="slate">{depts.length} departments</Badge>
        </div>
        {depts.length ? (
          <div className="mt-2 divide-y divide-slate-100">
            {depts.map((department) => (
              <div key={department.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">{department.name}</p>
                  <p className="mt-0.5 text-xs text-ink-500">Floor {department.floor} · {department.staff} staff</p>
                </div>
                <Badge tone={department.open ? 'emerald' : 'slate'}>{department.open ? 'Open' : 'Paused'}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="pt-4 text-sm text-ink-500">Department analytics will appear when departments are added.</p>
        )}
      </Card>
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Bed;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 font-display text-3xl text-ink-900">{value}</p>
      <p className="mt-1 text-xs text-ink-500">{detail}</p>
    </Card>
  );
}

function TrendCard({ title, value, points, detail, color }: { title: string; value: number; points: number[]; detail: string; color?: string }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{title}</p>
      <p className="mt-2 font-display text-3xl text-ink-900">{value}</p>
      {points.length ? <Sparkline className="mt-3 h-12 w-full" points={points} color={color} /> : <div className="mt-3 h-12 rounded-lg bg-slate-50" aria-hidden />}
      <p className="mt-2 text-xs text-ink-500">{detail}</p>
    </Card>
  );
}

function StatusCard({ title, labels, counts, link, linkLabel }: { title: string; labels: string[]; counts: number[]; link: string; linkLabel: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink-900">{title} status</h2>
        <Link to={link} className="text-xs font-semibold text-brand-700 hover:text-brand-800">{linkLabel}</Link>
      </div>
      <div className="mt-3 divide-y divide-slate-100">
        {labels.map((label, index) => (
          <div key={label} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-ink-600">{label}</span>
            <span className="font-semibold tabular-nums text-ink-900">{counts[index] ?? 0}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
