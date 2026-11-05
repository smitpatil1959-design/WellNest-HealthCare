import type {
  Admission,
  Department,
  DischargeDraft,
  HospitalAppointment,
  HospitalConsult,
  HospitalDoctor,
  HospitalNotice,
  HospitalOrg,
  HospitalPatient,
  HospitalReport,
  LabRequest,
} from '../types/hospital';
import { paths } from '../routes/paths';

export const hospitalOrg: HospitalOrg = {
  name: 'Northline Medical',
  legalName: 'Northline Medical Center, P.C.',
  registration: 'WA-HSP-440218',
  npi: '1847291055',
  address: '900 Dexter Ave N, Seattle, WA 98109',
  phone: '+1 (206) 555-0100',
  email: 'ops@northline.health',
  hours: 'Open 24 hours · ED always staffed',
  verified: true,
  logo: '/images/hospital-lobby.jpg',
  campus: 'Queen Anne',
  beds: 186,
};

export const departments: Department[] = [
  { id: 'dep-im', name: 'General Medicine', floor: '3', head: 'Dr. Maya Chen', staff: 18, open: true },
  { id: 'dep-card', name: 'Cardiology', floor: '5', head: 'Dr. James Okonkwo', staff: 11, open: true },
  { id: 'dep-neuro', name: 'Neurology', floor: '6', head: 'Dr. Lina Park', staff: 8, open: true },
  { id: 'dep-ortho', name: 'Orthopedics', floor: '4', head: 'Dr. Samir Cole', staff: 9, open: true },
  { id: 'dep-peds', name: 'Pediatrics', floor: '2', head: 'Dr. Amira Reyes', staff: 14, open: true },
  { id: 'dep-rad', name: 'Radiology', floor: 'B1', head: 'Dr. Evan Cho', staff: 12, open: true },
  { id: 'dep-path', name: 'Pathology', floor: 'B2', head: 'Dr. Ruth Adeyemi', staff: 7, open: true },
  { id: 'dep-ed', name: 'Emergency', floor: '1', head: 'Dr. Noah Ellis', staff: 22, open: true },
];

export const hospitalDoctors: HospitalDoctor[] = [
  {
    id: 'hd-chen',
    name: 'Dr. Maya Chen',
    specialty: 'Internal medicine',
    departmentId: 'dep-im',
    npi: '1487654321',
    phone: '+1 (206) 555-0108',
    status: 'active',
    avatar: '/images/portrait-dr-chen.jpg',
    available: true,
    patientsToday: 9,
  },
  {
    id: 'hd-ok',
    name: 'Dr. James Okonkwo',
    specialty: 'Cardiology',
    departmentId: 'dep-card',
    npi: '1678901234',
    phone: '+1 (206) 555-0160',
    status: 'active',
    avatar: '/images/portrait-dr-okonkwo.jpg',
    available: true,
    patientsToday: 6,
  },
  {
    id: 'hd-reyes',
    name: 'Dr. Amira Reyes',
    specialty: 'Pediatrics',
    departmentId: 'dep-peds',
    npi: '1555099887',
    phone: '+1 (206) 555-0194',
    status: 'active',
    avatar: '/images/portrait-dr-reyes.jpg',
    available: false,
    patientsToday: 0,
  },
  {
    id: 'hd-ellis',
    name: 'Dr. Noah Ellis',
    specialty: 'Emergency medicine',
    departmentId: 'dep-ed',
    npi: '1333001122',
    phone: '+1 (206) 555-0112',
    status: 'pending',
    avatar: '/images/portrait-exec.jpg',
    available: true,
    patientsToday: 14,
  },
];

export const hospitalPatients: HospitalPatient[] = [
  {
    id: 'hp-elena',
    name: 'Elena Voss',
    dob: '1984-06-14',
    age: 41,
    sex: 'Female',
    mrn: 'NL-04186',
    phone: '+1 (206) 555-0172',
    email: 'demo@wellnest.example',
    city: 'Seattle',
    emergencyName: 'Marcus Voss',
    emergencyPhone: '+1 (206) 555-0144',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Tree nuts'],
    avatar: '/images/portrait-patient.jpg',
    lastVisit: '2026-03-02',
  },
  {
    id: 'hp-marcus',
    name: 'Marcus Hale',
    dob: '1968-01-09',
    age: 58,
    sex: 'Male',
    mrn: 'NL-22910',
    phone: '+1 (425) 555-0188',
    email: 'marcus.hale@email.com',
    city: 'Bellevue',
    emergencyName: 'Dana Hale',
    emergencyPhone: '+1 (425) 555-0189',
    bloodGroup: 'A−',
    allergies: ['Sulfa drugs'],
    avatar: '/images/portrait-exec.jpg',
    lastVisit: '2026-03-20',
  },
  {
    id: 'hp-sofia',
    name: 'Sofia Lind',
    dob: '1958-11-02',
    age: 67,
    sex: 'Female',
    mrn: 'NL-55019',
    phone: '+1 (425) 555-0133',
    email: 'sofia.lind@email.com',
    city: 'Edmonds',
    emergencyName: 'Lars Lind',
    emergencyPhone: '+1 (425) 555-0134',
    bloodGroup: 'AB+',
    allergies: ['Iodine contrast'],
    avatar: '/images/portrait-amara.jpg',
    lastVisit: '2026-03-28',
  },
  {
    id: 'hp-priya',
    name: 'Priya Nair',
    dob: '1991-08-21',
    age: 34,
    sex: 'Female',
    mrn: 'NL-11844',
    phone: '+1 (425) 555-0166',
    email: 'priya.nair@email.com',
    city: 'Redmond',
    emergencyName: 'Arjun Nair',
    emergencyPhone: '+1 (425) 555-0167',
    bloodGroup: 'B+',
    allergies: [],
    avatar: '/images/portrait-dr-reyes.jpg',
    lastVisit: '2026-02-14',
  },
];

export const hospitalAppointments: HospitalAppointment[] = [
  { id: 'ha-1', patientId: 'hp-elena', doctorId: 'hd-chen', departmentId: 'dep-im', date: '2026-04-08', time: '08:30', status: 'completed', reason: 'Hypertension follow-up' },
  { id: 'ha-2', patientId: 'hp-marcus', doctorId: 'hd-chen', departmentId: 'dep-im', date: '2026-04-08', time: '09:10', status: 'waiting', reason: 'Diabetes review' },
  { id: 'ha-3', patientId: 'hp-priya', doctorId: 'hd-reyes', departmentId: 'dep-peds', date: '2026-04-08', time: '10:00', status: 'upcoming', reason: 'Migraine consult' },
  { id: 'ha-4', patientId: 'hp-sofia', doctorId: 'hd-ok', departmentId: 'dep-card', date: '2026-04-08', time: '14:00', status: 'upcoming', reason: 'Anticoagulation' },
  { id: 'ha-5', patientId: 'hp-elena', doctorId: 'hd-ok', departmentId: 'dep-card', date: '2026-04-18', time: '10:20', status: 'upcoming', reason: 'Cardiology follow-up' },
  { id: 'ha-6', patientId: 'hp-priya', doctorId: 'hd-reyes', departmentId: 'dep-peds', date: '2026-04-03', time: '15:40', status: 'canceled', reason: 'Travel' },
];

export const admissions: Admission[] = [
  { id: 'adm-1', patientId: 'hp-sofia', doctorId: 'hd-ok', departmentId: 'dep-card', room: '512', bed: 'A', admitted: '2026-04-06', expected: '2026-04-09', status: 'admitted', reason: 'Rate control, AF' },
  { id: 'adm-2', patientId: 'hp-marcus', doctorId: 'hd-chen', departmentId: 'dep-im', room: '308', bed: 'B', admitted: '2026-04-07', expected: '2026-04-08', status: 'observation', reason: 'Hyperglycemia' },
  { id: 'adm-3', patientId: 'hp-elena', doctorId: 'hd-ellis', departmentId: 'dep-ed', room: 'ED-4', bed: '1', admitted: '2025-11-19', expected: '2025-11-20', status: 'discharged', reason: 'Palpitations — observation' },
];

export const hospitalReports: HospitalReport[] = [
  { id: 'hr-1', patientId: 'hp-elena', title: 'CMP', type: 'Laboratory', date: '2026-03-28', source: 'laboratory', uploader: 'Harbor Laboratory', verified: true, summary: 'Mild ALT elevation.', updated: '2026-03-28' },
  { id: 'hr-2', patientId: 'hp-sofia', title: 'ECG', type: 'Imaging', date: '2026-03-28', source: 'hospital', uploader: 'Radiology night team', verified: true, summary: 'Rate-controlled AF.', updated: '2026-03-28' },
  { id: 'hr-3', patientId: 'hp-marcus', title: 'Insurance letter', type: 'Upload', date: '2026-03-19', source: 'patient', uploader: 'Marcus Hale', verified: false, summary: 'Patient-uploaded. Not hospital-verified.', updated: '2026-03-19' },
  { id: 'hr-4', patientId: 'hp-elena', title: 'Discharge observation', type: 'Discharge', date: '2025-11-19', source: 'hospital', uploader: 'Dr. Amira Reyes', verified: true, summary: 'Telemetry unremarkable.', updated: '2025-11-20' },
];

export const hospitalConsults: HospitalConsult[] = [
  { id: 'hc-1', patientId: 'hp-elena', doctorId: 'hd-chen', date: '2026-03-02', diagnosis: 'Essential hypertension — stable', notes: 'Renewed Lisinopril.', rx: 'Lisinopril 10 mg daily', labs: ['Lipid panel'], followUp: '2026-05-06' },
];

export const labRequests: LabRequest[] = [
  { id: 'lr-1', patientId: 'hp-elena', doctorId: 'hd-chen', test: 'Lipid panel', status: 'received', requested: '2026-04-02' },
  { id: 'lr-2', patientId: 'hp-marcus', doctorId: 'hd-chen', test: 'HbA1c', status: 'completed', requested: '2026-03-18' },
  { id: 'lr-3', patientId: 'hp-sofia', doctorId: 'hd-ok', test: 'BMP', status: 'requested', requested: '2026-04-07' },
  { id: 'lr-4', patientId: 'hp-elena', doctorId: 'hd-chen', test: 'CMP', status: 'notified', requested: '2026-03-26' },
];

export const dischargeDrafts: DischargeDraft[] = [
  {
    id: 'dd-1',
    admissionId: 'adm-2',
    patientId: 'hp-marcus',
    diagnosis: 'Hyperglycemia in type 2 diabetes',
    treatment: 'IV fluids, insulin correction, diet counseling',
    procedures: 'None',
    medication: 'Metformin 1000 mg BID · sliding-scale insulin at home if instructed',
    followUp: 'PCP in 5 days · A1C in 12 weeks',
    instructions: 'Check fasting glucose daily. Return if lethargy or vomiting.',
    approved: false,
  },
];

export const hospitalNotices: HospitalNotice[] = [
  { id: 'hn-1', kind: 'alert', title: 'ED boarding at 4 hours', body: 'Two holds waiting for telemetry beds.', time: '8 min ago', href: paths.app.hospitalAdmissions },
  { id: 'hn-2', kind: 'lab', title: 'Lipid panel received for Elena Voss', body: 'Harbor Lab acknowledged the order.', time: '22 min ago', href: paths.app.hospitalLabs },
  { id: 'hn-3', kind: 'admit', title: 'Sofia Lind still on 512-A', body: 'Expected discharge tomorrow AM.', time: '1 hour ago', href: paths.app.hospitalAdmissions },
  { id: 'hn-4', kind: 'appt', title: 'Marcus Hale waiting in 3A', body: 'Diabetes review with Dr. Chen.', time: 'Just now', href: paths.app.hospitalAppointments },
  { id: 'hn-5', kind: 'staff', title: 'Dr. Ellis credential pending', body: 'Emergency medicine onboarding incomplete.', time: 'Yesterday', href: paths.app.hospitalDoctors },
];

export const occupancy = [
  { floor: 'ED', used: 14, total: 18 },
  { floor: '2 Peds', used: 9, total: 16 },
  { floor: '3 Medicine', used: 22, total: 28 },
  { floor: '4 Ortho', used: 11, total: 20 },
  { floor: '5 Cardio', used: 16, total: 20 },
];

export const volumeSeries = [42, 48, 45, 51, 55, 49, 58, 61, 57];
export const admitSeries = [6, 8, 7, 9, 5, 8, 10, 7, 6];
