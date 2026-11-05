import type { UserRole } from '../types/roles';
import { paths } from '../routes/paths';

export interface AppNavItem {
  label: string;
  href: string;
  icon:
    | 'home'
    | 'timeline'
    | 'shield'
    | 'calendar'
    | 'users'
    | 'building'
    | 'flask'
    | 'pill'
    | 'file'
    | 'settings'
    | 'audit'
    | 'syringe'
    | 'bell'
    | 'siren'
    | 'help'
    | 'heart';
}

export const appNavByRole: Record<UserRole, AppNavItem[]> = {
  patient: [
    { label: 'Dashboard', href: paths.app.patient, icon: 'home' },
    { label: 'Medical Records', href: paths.app.patientRecords, icon: 'file' },
    { label: 'Lab Reports', href: paths.app.patientLabs, icon: 'flask' },
    { label: 'Prescriptions', href: paths.app.patientPrescriptions, icon: 'file' },
    { label: 'Appointments', href: paths.app.patientAppointments, icon: 'calendar' },
    { label: 'Doctors', href: paths.app.patientDoctors, icon: 'users' },
    { label: 'Hospitals', href: paths.app.patientHospitals, icon: 'building' },
    { label: 'Medication', href: paths.app.patientMedications, icon: 'pill' },
    { label: 'Vaccination', href: paths.app.patientVaccinations, icon: 'syringe' },
    { label: 'Insurance', href: paths.app.patientInsurance, icon: 'heart' },
    { label: 'Health Timeline', href: paths.app.patientTimeline, icon: 'timeline' },
    { label: 'Notifications', href: paths.app.patientNotifications, icon: 'bell' },
    { label: 'My Health ID', href: paths.app.patientHealthId, icon: 'heart' },
    { label: 'Who can access', href: paths.app.patientAccess, icon: 'shield' },
    { label: 'Access requests', href: paths.app.patientRequests, icon: 'bell' },
    { label: 'Emergency Access', href: paths.app.patientEmergency, icon: 'siren' },
    { label: 'Help Center', href: paths.app.patientHelp, icon: 'help' },
  ],
  doctor: [
    { label: 'Dashboard', href: paths.app.doctor, icon: 'home' },
    { label: 'Patients', href: paths.app.doctorPatients, icon: 'users' },
    { label: 'Appointments', href: paths.app.doctorAppointments, icon: 'calendar' },
    { label: 'Reports', href: paths.app.doctorReports, icon: 'file' },
    { label: 'Prescriptions', href: paths.app.doctorPrescriptions, icon: 'pill' },
    { label: 'Workflow', href: paths.app.doctorWorkflow, icon: 'timeline' },
    { label: 'Lookup Health ID', href: paths.app.lookup, icon: 'heart' },
    { label: 'Notifications', href: paths.app.doctorNotifications, icon: 'bell' },
  ],
  hospital: [
    { label: 'Overview', href: paths.app.hospital, icon: 'home' },
    { label: 'Patients', href: paths.app.hospitalPatients, icon: 'users' },
    { label: 'Register patient', href: paths.app.hospitalRegister, icon: 'file' },
    { label: 'Doctors', href: paths.app.hospitalDoctors, icon: 'heart' },
    { label: 'Departments', href: paths.app.hospitalDepartments, icon: 'building' },
    { label: 'Appointments', href: paths.app.hospitalAppointments, icon: 'calendar' },
    { label: 'Admissions', href: paths.app.hospitalAdmissions, icon: 'siren' },
    { label: 'Reports', href: paths.app.hospitalReports, icon: 'file' },
    { label: 'Consultations', href: paths.app.hospitalRecords, icon: 'timeline' },
    { label: 'Laboratory', href: paths.app.hospitalLabs, icon: 'flask' },
    { label: 'Discharge', href: paths.app.hospitalDischarge, icon: 'audit' },
    { label: 'Analytics', href: paths.app.hospitalAnalytics, icon: 'timeline' },
    { label: 'Notifications', href: paths.app.hospitalNotifications, icon: 'bell' },
    { label: 'Staff roles', href: paths.app.hospitalStaff, icon: 'shield' },
    { label: 'Lookup Health ID', href: paths.app.lookup, icon: 'heart' },
    { label: 'Hospital profile', href: paths.app.hospitalProfile, icon: 'building' },
  ],
  laboratory: [
    { label: 'Overview', href: paths.app.laboratory, icon: 'home' },
    { label: 'Tests', href: paths.app.labTests, icon: 'flask' },
    { label: 'Create report', href: paths.app.labCompose, icon: 'file' },
    { label: 'Reports', href: paths.app.labReports, icon: 'file' },
    { label: 'Verification queue', href: paths.app.labVerify, icon: 'shield' },
    { label: 'Critical results', href: paths.app.labCritical, icon: 'siren' },
    { label: 'Publish reports', href: paths.app.labPublish, icon: 'timeline' },
    { label: 'Analytics', href: paths.app.labAnalytics, icon: 'audit' },
    { label: 'Notifications', href: paths.app.labNotifications, icon: 'bell' },
    { label: 'Staff roles', href: paths.app.labStaff, icon: 'users' },
    { label: 'Lookup Health ID', href: paths.app.lookup, icon: 'heart' },
    { label: 'Lab profile', href: paths.app.labProfile, icon: 'building' },
  ],
  pharmacy: [
    { label: 'Overview', href: paths.app.pharmacy, icon: 'home' },
    { label: 'Prescriptions', href: paths.app.pharmacyQueue, icon: 'pill' },
    { label: 'Verification queue', href: paths.app.pharmacyVerify, icon: 'shield' },
    { label: 'Inventory', href: paths.app.pharmacyInventory, icon: 'file' },
    { label: 'Orders', href: paths.app.pharmacyOrders, icon: 'timeline' },
    { label: 'Notify patient', href: paths.app.pharmacyConnect, icon: 'bell' },
    { label: 'Analytics', href: paths.app.pharmacyAnalytics, icon: 'audit' },
    { label: 'Notifications', href: paths.app.pharmacyNotifications, icon: 'bell' },
    { label: 'Staff roles', href: paths.app.pharmacyStaff, icon: 'users' },
    { label: 'Lookup Health ID', href: paths.app.lookup, icon: 'heart' },
    { label: 'Pharmacy profile', href: paths.app.pharmacyProfile, icon: 'building' },
  ],
  insurance: [
    { label: 'Overview', href: paths.app.insurance, icon: 'home' },
    { label: 'Policies', href: paths.app.insurancePolicies, icon: 'file' },
    { label: 'Claims', href: paths.app.insuranceClaims, icon: 'timeline' },
    { label: 'Claims review', href: paths.app.insuranceReview, icon: 'shield' },
    { label: 'Members', href: paths.app.insuranceMembers, icon: 'users' },
    { label: 'Documents', href: paths.app.insuranceDocuments, icon: 'file' },
    { label: 'Fraud review', href: paths.app.insuranceFraud, icon: 'siren' },
    { label: 'Analytics', href: paths.app.insuranceAnalytics, icon: 'audit' },
    { label: 'Notifications', href: paths.app.insuranceNotifications, icon: 'bell' },
    { label: 'Lookup Health ID', href: paths.app.lookup, icon: 'heart' },
    { label: 'Staff roles', href: paths.app.insuranceStaff, icon: 'users' },
    { label: 'Insurance profile', href: paths.app.insuranceProfile, icon: 'building' },
  ],
  administrator: [
    { label: 'Overview', href: paths.app.admin, icon: 'home' },
    { label: 'Users', href: paths.app.adminUsers, icon: 'users' },
    { label: 'Organizations', href: paths.app.adminOrganizations, icon: 'building' },
    { label: 'Verification', href: paths.app.adminVerification, icon: 'shield' },
    { label: 'Activity', href: paths.app.adminActivity, icon: 'timeline' },
    { label: 'Audit log', href: paths.app.adminAudit, icon: 'audit' },
    { label: 'Permissions', href: paths.app.adminPermissions, icon: 'file' },
    { label: 'System health', href: paths.app.adminHealth, icon: 'heart' },
    { label: 'Security', href: paths.app.adminSecurity, icon: 'siren' },
    { label: 'Analytics', href: paths.app.adminAnalytics, icon: 'audit' },
    { label: 'Notifications', href: paths.app.adminNotifications, icon: 'bell' },
  ],
};

export const accountNav: AppNavItem[] = [
  { label: 'Support & privacy', href: paths.app.support, icon: 'help' },
  { label: 'Settings', href: paths.app.settings, icon: 'settings' },
  { label: 'Profile', href: paths.app.profile, icon: 'users' },
];
