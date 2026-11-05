import { NavLink } from 'react-router-dom';
import { Building2, Calendar, FileText, FlaskConical, HeartPulse, Home, Menu, Pill, Siren, Stethoscope, UserRound, Users } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { dashboardPathFor } from '../../services/auth/authService';
import { paths } from '../../routes/paths';
import { cn } from '../../utils/cn';

export function AppBottomNav({ onMenu }: { onMenu?: () => void }) {
  const { role } = useAuth();
  const home = role ? dashboardPathFor(role) : paths.app.root;

  const patientItems = [
    { to: paths.app.patient, label: 'Home', icon: Home, end: true },
    { to: paths.app.patientRecords, label: 'Records', icon: FileText, end: false },
    { to: paths.app.patientAppointments, label: 'Visits', icon: Calendar, end: false },
    { to: paths.app.patientHealthId, label: 'ID', icon: HeartPulse, end: false },
    { to: paths.app.profile, label: 'You', icon: UserRound, end: false },
  ];

  const doctorItems = [
    { to: paths.app.doctor, label: 'Home', icon: Home, end: true },
    { to: paths.app.doctorPatients, label: 'Patients', icon: Users, end: false },
    { to: paths.app.doctorAppointments, label: 'Clinic', icon: Calendar, end: false },
    { to: paths.app.doctorReports, label: 'Reports', icon: Stethoscope, end: false },
    { to: paths.app.profile, label: 'You', icon: UserRound, end: false },
  ];

  const hospitalItems = [
    { to: paths.app.hospital, label: 'Home', icon: Home, end: true },
    { to: paths.app.hospitalPatients, label: 'Patients', icon: Users, end: false },
    { to: paths.app.hospitalAppointments, label: 'Clinic', icon: Calendar, end: false },
    { to: paths.app.hospitalAdmissions, label: 'Beds', icon: Building2, end: false },
    { to: paths.app.profile, label: 'You', icon: UserRound, end: false },
  ];

  const labItems = [
    { to: paths.app.laboratory, label: 'Home', icon: Home, end: true },
    { to: paths.app.labTests, label: 'Tests', icon: FlaskConical, end: false },
    { to: paths.app.labVerify, label: 'Verify', icon: Stethoscope, end: false },
    { to: paths.app.labCritical, label: 'STAT', icon: Siren, end: false },
    { to: paths.app.profile, label: 'You', icon: UserRound, end: false },
  ];

  const pharmacyItems = [
    { to: paths.app.pharmacy, label: 'Home', icon: Home, end: true },
    { to: paths.app.pharmacyQueue, label: 'Rx', icon: Pill, end: false },
    { to: paths.app.pharmacyVerify, label: 'Verify', icon: Stethoscope, end: false },
    { to: paths.app.pharmacyInventory, label: 'Stock', icon: FileText, end: false },
    { to: paths.app.profile, label: 'You', icon: UserRound, end: false },
  ];

  const insuranceItems = [
    { to: paths.app.insurance, label: 'Home', icon: Home, end: true },
    { to: paths.app.insuranceClaims, label: 'Claims', icon: FileText, end: false },
    { to: paths.app.insuranceReview, label: 'Review', icon: Stethoscope, end: false },
    { to: paths.app.insurancePolicies, label: 'Policies', icon: Building2, end: false },
    { to: paths.app.profile, label: 'You', icon: UserRound, end: false },
  ];

  const adminItems = [
    { to: paths.app.admin, label: 'Home', icon: Home, end: true },
    { to: paths.app.adminUsers, label: 'Users', icon: Users, end: false },
    { to: paths.app.adminVerification, label: 'Verify', icon: Stethoscope, end: false },
    { to: paths.app.adminAudit, label: 'Audit', icon: FileText, end: false },
    { to: paths.app.profile, label: 'You', icon: UserRound, end: false },
  ];

  const fallback = [
    { to: home, label: 'Home', icon: Home, end: true },
    { to: paths.app.profile, label: 'Profile', icon: UserRound, end: false },
    { to: paths.app.settings, label: 'More', icon: FileText, end: false },
  ];

  const items =
    role === 'patient'
      ? patientItems
      : role === 'doctor'
        ? doctorItems
        : role === 'hospital'
          ? hospitalItems
          : role === 'laboratory'
            ? labItems
            : role === 'pharmacy'
              ? pharmacyItems
              : role === 'insurance'
                ? insuranceItems
                : role === 'administrator'
                  ? adminItems
                  : fallback;

  return (
    <nav
      aria-label="App shortcuts"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dbe3d0] bg-[#fafbf5]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden"
    >
      <ul className={cn('mx-auto grid max-w-md', items.length === 5 ? 'grid-cols-5' : 'grid-cols-3')}>
        {items.map((item, index) => {
          const Icon = item.icon;
          if (index === items.length - 1 && onMenu) return <li key="menu"><button type="button" onClick={onMenu} aria-label="Open all workspace pages" className="flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold text-[#617554]"><Menu size={16} /><span>More</span></button></li>;
          return (
            <li key={item.label}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors',
                    isActive ? 'text-emerald-800 bg-emerald-50/80' : 'text-ink-400 hover:text-emerald-800',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
