import { motion } from 'framer-motion';
import {
  Building2,
  UserPlus,
  HeartPulse,
  Stethoscope,
  Bed,
  Calendar,
  Users,
  LogOut,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sparkline } from '../../components/ui/Sparkline';
import { OrganizationWorkspaceBanner } from '../../components/organization/OrganizationWorkspaceBanner';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { paths } from '../../routes/paths';
import { fadeUp, stagger } from '../../animations/variants';

export default function HospitalDashboardPage() {
  const portal = useHospitalPortal();
  const { organization, memberCount, staffRole, isOrgAdmin } = portal;

  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = portal.appointments.filter((a) => a.date === today && a.status !== 'canceled');
  const activeDocs = portal.doctors.filter((d) => d.status === 'active' && d.available).length;
  const inHouseAdmits = portal.admits.filter((a) => a.status !== 'discharged');
  const inHouseCount = inHouseAdmits.length;
  const pendingDischargeCount = portal.admits.filter((a) => a.status === 'pending-discharge').length;
  const todayAdmissionsCount = portal.admits.filter((a) => a.admitted === today).length;
  const departmentCensus = portal.depts.map((department) => ({
    department,
    count: inHouseAdmits.filter((admission) => admission.departmentId === department.id).length,
  }));
  const maxDepartmentCensus = Math.max(...departmentCensus.map((item) => item.count), 1);
  const upcomingAppointments = portal.appointments
    .filter((appointment) => (appointment.status === 'upcoming' || appointment.status === 'waiting') && appointment.date >= today)
    .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))
    .slice(0, 3);

  const roleLabels: Record<string, string> = {
    admin: 'Hospital Administrator',
    doctor: 'Attending Physician',
    receptionist: 'Intake / Receptionist',
    nurse: 'Floor Nurse',
    laboratory: 'Hospital Lab Staff',
  };

  const navLinks = [
    { label: 'Overview', href: paths.app.hospital },
    { label: 'Patients', href: paths.app.hospitalPatients },
    { label: 'Physicians', href: paths.app.hospitalDoctors },
    { label: 'Departments', href: paths.app.hospitalDepartments },
    { label: 'Admissions', href: paths.app.hospitalAdmissions },
    { label: 'Reports', href: paths.app.hospitalReports },
    { label: 'Staff Roles', href: paths.app.hospitalStaff },
    { label: 'Hospital Profile', href: paths.app.hospitalProfile },
  ];

  return (
    <>
      <Seo
        title={`${organization?.display_name || 'Hospital'} Workspace`}
        description="Hospital command center, admissions, staff, and departmental operations."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <OrganizationWorkspaceBanner
          org={organization}
          workspaceTitle="HOSPITAL WORKSPACE"
          userRoleLabel={roleLabels[staffRole] || staffRole}
          memberCount={memberCount}
          navLinks={navLinks}
          profileLink={paths.app.hospitalProfile}
        />

        {/* Live Operational Stat Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <div className="workspace-metric rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-brand-700">Departments with inpatients</p>
              <Bed className="h-4 w-4 text-brand-600" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
              {departmentCensus.filter((item) => item.count > 0).length}
            </p>
            <p className="mt-1 text-[11px] text-brand-700 font-medium">
              of {portal.depts.length} listed departments
            </p>
          </div>

          <div className="workspace-metric rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-500">In-House Inpatients</p>
              <Users className="h-4 w-4 text-ink-400" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              {inHouseCount}
            </p>
            <p className="mt-1 text-[11px] text-ink-500 font-medium">
              {todayAdmissionsCount} admitted today
            </p>
          </div>

          <div className="workspace-metric rounded-xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-800">Pending Discharges</p>
              <LogOut className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-amber-900 sm:text-3xl">
              {pendingDischargeCount}
            </p>
            <p className="mt-1 text-[11px] text-amber-700 font-medium">
              Ready for final discharge
            </p>
          </div>

          <div className="workspace-metric rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-500">Today's Clinic Visits</p>
              <Calendar className="h-4 w-4 text-ink-400" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              {todayAppts.length}
            </p>
            <p className="mt-1 text-[11px] text-ink-500 font-medium">
              {activeDocs} attending doctors on duty
            </p>
          </div>
        </motion.div>

        {/* Quick Action Buttons Grid */}
        <motion.div variants={fadeUp} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">Facility Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Button to={paths.app.hospitalRegister} size="sm" leftIcon={<UserPlus className="h-4 w-4" />}>
              Register New Patient
            </Button>
            <Button to={paths.app.hospitalAdmissions} variant="outline" size="sm" leftIcon={<Bed className="h-4 w-4" />}>
              Inpatient Admissions
            </Button>
            <Button to={paths.app.hospitalAppointments} variant="outline" size="sm" leftIcon={<Calendar className="h-4 w-4" />}>
              Clinic Schedules
            </Button>
            <Button to={paths.app.hospitalDoctors} variant="outline" size="sm" leftIcon={<Stethoscope className="h-4 w-4" />}>
              Physician Roster
            </Button>
          </div>
        </motion.div>

        {/* Department census and next appointments */}
        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-semibold text-ink-900">Current admissions by department</h2>
                <p className="text-xs text-ink-500">Inpatient and observation admissions grouped by department</p>
              </div>
              <Sparkline points={departmentCensus.map((item) => item.count)} className="h-8 w-28" />
            </div>
            <div className="space-y-4">
              {departmentCensus.map(({ department, count }) => {
                const pct = Math.round((count / maxDepartmentCensus) * 100);
                return (
                  <div key={department.id} className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-ink-900">{department.name}</span>
                      <span className="font-mono text-ink-600">{count} admitted</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-semibold text-ink-900">Next appointments</h2>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">{upcomingAppointments.length} upcoming</span>
            </div>
            {upcomingAppointments.length ? (
              <ul className="space-y-3 text-xs">
                {upcomingAppointments.map((appointment) => {
                  const patient = portal.patients.find((item) => item.id === appointment.patientId);
                  return (
                    <li key={appointment.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <p className="font-semibold text-ink-900">{patient?.name || 'Patient appointment'}</p>
                      <p className="mt-1 text-[11px] text-ink-500">{appointment.date} · {appointment.time} · {appointment.reason}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-ink-500">No upcoming appointments are scheduled.</p>
            )}
            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              <Button to={paths.app.hospitalAdmissions} size="sm" variant="outline" className="w-full justify-center">
                Review Inpatient Admissions ({inHouseCount})
              </Button>
            </div>
          </Card>
        </div>

        {/* Service Wings & Medical Staff */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Credentialed Physicians</p>
            <p className="mt-2 font-display text-4xl font-bold text-ink-900">{portal.doctors.length}</p>
            <p className="text-xs text-ink-500 mt-1">{activeDocs} clinicians currently on active duty</p>
            <div className="mt-4">
              <Button to={paths.app.hospitalDoctors} size="sm" variant="outline" leftIcon={<Stethoscope className="h-4 w-4" />}>
                Manage Staff Roster
              </Button>
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Clinical Departments</p>
            <p className="mt-2 font-display text-4xl font-bold text-ink-900">{portal.depts.length}</p>
            <p className="text-xs text-ink-500 mt-1">Active specialized inpatient wings</p>
            <div className="mt-4">
              <Button to={paths.app.hospitalDepartments} size="sm" variant="outline" leftIcon={<HeartPulse className="h-4 w-4" />}>
                View Service Departments
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-ink-900">Hospital Administration</h2>
            <p className="mt-1 text-xs text-ink-500">
              {isOrgAdmin ? 'Administrative Privileges Active' : 'Standard Clinical Staff Access'}
            </p>
            <div className="mt-4 grid gap-2">
              <Button to={paths.app.hospitalProfile} variant="primary" size="sm" leftIcon={<Building2 className="h-4 w-4" />}>
                Facility Profile & Licenses
              </Button>
              <Button to={paths.app.hospitalStaff} variant="outline" size="sm">
                Staff Credentials & Permissions
              </Button>
            </div>
          </Card>
        </div>
      </motion.div>
    </>
  );
}
