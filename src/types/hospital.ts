export type HospitalStaffRole = 'admin' | 'doctor' | 'receptionist' | 'nurse' | 'laboratory';
export type ApptStatus = 'upcoming' | 'waiting' | 'completed' | 'canceled';
export type AdmissionStatus = 'admitted' | 'observation' | 'pending-discharge' | 'discharged';
export type ReportSource = 'hospital' | 'doctor' | 'laboratory' | 'patient';
export type DoctorAccountStatus = 'active' | 'inactive' | 'pending';

export interface HospitalOrg {
  name: string;
  legalName: string;
  registration: string;
  npi: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  verified: boolean;
  logo: string;
  campus: string;
  beds: number;
}

export interface Department {
  id: string;
  name: string;
  floor: string;
  head: string;
  staff: number;
  open: boolean;
}

export interface HospitalDoctor {
  id: string;
  name: string;
  specialty: string;
  departmentId: string;
  npi: string;
  phone: string;
  status: DoctorAccountStatus;
  avatar: string;
  available: boolean;
  patientsToday: number;
}

export interface HospitalPatient {
  id: string;
  name: string;
  dob: string;
  age: number;
  sex: string;
  mrn: string;
  phone: string;
  email: string;
  city: string;
  emergencyName: string;
  emergencyPhone: string;
  bloodGroup: string;
  allergies: string[];
  avatar: string;
  lastVisit: string;
}

export interface HospitalAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  date: string;
  time: string;
  status: ApptStatus;
  reason: string;
}

export interface Admission {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  room: string;
  bed: string;
  admitted: string;
  expected: string;
  status: AdmissionStatus;
  reason: string;
}

export interface HospitalReport {
  id: string;
  patientId: string;
  title: string;
  type: string;
  date: string;
  source: ReportSource;
  uploader: string;
  verified: boolean;
  summary: string;
  updated: string;
}

export interface HospitalConsult {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  diagnosis: string;
  notes: string;
  rx: string;
  labs: string[];
  followUp: string;
}

export interface LabRequest {
  id: string;
  patientId: string;
  doctorId: string;
  test: string;
  status: 'requested' | 'received' | 'completed' | 'reviewed' | 'notified';
  requested: string;
}

export interface DischargeDraft {
  id: string;
  admissionId: string;
  patientId: string;
  diagnosis: string;
  treatment: string;
  procedures: string;
  medication: string;
  followUp: string;
  instructions: string;
  approved: boolean;
}

export interface HospitalNotice {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: 'alert' | 'lab' | 'admit' | 'appt' | 'staff';
  href: string;
}
