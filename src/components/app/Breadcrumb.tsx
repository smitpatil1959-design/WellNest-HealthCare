import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const labels: Record<string, string> = {
  app: 'Workspace',
  patient: 'Patient',
  doctor: 'Doctor',
  hospital: 'Hospital',
  laboratory: 'Laboratory',
  pharmacy: 'Pharmacy',
  insurance: 'Insurance',
  admin: 'Admin',
  profile: 'Profile',
  settings: 'Settings',
  timeline: 'Timeline',
  consents: 'Consents',
  schedule: 'Schedule',
  patients: 'Patients',
  encounters: 'Encounters',
  directory: 'Directory',
  panels: 'Panels',
  orders: 'Orders',
  queue: 'Queue',
  inventory: 'Inventory',
  reviews: 'Reviews',
  authorizations: 'Authorizations',
  organizations: 'Organizations',
  audit: 'Audit',
  records: 'Records',
  labs: 'Labs',
  prescriptions: 'Prescriptions',
  appointments: 'Appointments',
  doctors: 'Doctors',
  hospitals: 'Hospitals',
  medications: 'Medications',
  vaccinations: 'Vaccinations',
  notifications: 'Notifications',
  emergency: 'Emergency',
  help: 'Help',
  consult: 'Consult',
  workflow: 'Workflow',
  reports: 'Reports',
  register: 'Register',
  departments: 'Departments',
  admissions: 'Admissions',
  discharge: 'Discharge',
  analytics: 'Analytics',
  staff: 'Staff',
  tests: 'Tests',
  compose: 'Compose',
  verify: 'Verify',
  critical: 'Critical',
  publish: 'Publish',
  connect: 'Notify',
  policies: 'Policies',
  claims: 'Claims',
  members: 'Members',
  documents: 'Documents',
  review: 'Review',
  fraud: 'Fraud',
  users: 'Users',
  verification: 'Verification',
  activity: 'Activity',
  permissions: 'Permissions',
  health: 'Health',
  security: 'Security',
  'health-id': 'Health ID',
  access: 'Access',
  requests: 'Requests',
  'access-history': 'History',
  lookup: 'Lookup',
};

export function Breadcrumb() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length <= 1) return null; // Don't show redundant top single breadcrumb

  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
      {parts.map((part, index) => {
        const href = `/${parts.slice(0, index + 1).join('/')}`;
        const last = index === parts.length - 1;
        const text = labels[part] ?? (part.length > 16 ? `${part.slice(0, 14)}…` : part);
        return (
          <span key={href} className="inline-flex items-center gap-1.5">
            {index > 0 ? <ChevronRight className="h-3 w-3 text-ink-300" /> : null}
            {last ? (
              <span className="font-semibold text-ink-800" aria-current="page">
                {text}
              </span>
            ) : (
              <Link to={href} className="transition-colors hover:text-ink-700">
                {text}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
