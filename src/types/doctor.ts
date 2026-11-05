export type VerificationSource =
  | 'doctor'
  | 'hospital'
  | 'laboratory'
  | 'patient'
  | 'unverified';

export type ConsultStatus = 'waiting' | 'in-progress' | 'completed' | 'canceled';
export type DoctorApptStatus = 'upcoming' | 'waiting' | 'in-progress' | 'completed' | 'canceled';
export type ReportKind = 'lab' | 'imaging' | 'note' | 'referral' | 'upload';

export interface DoctorIdentity {
  name: string;
  specialty: string;
  hospital: string;
  npi: string;
  avatar: string;
}

export interface AuthorizedPatient {
  id: string;
  name: string;
  age: number;
  sex: string;
  patientId: string;
  bloodGroup: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  avatar: string;
  consentUntil: string;
  lastVisit: string;
  emergencyContact: string;
  city: string;
}

export interface DoctorAppointment {
  id: string;
  patientId: string;
  title: string;
  time: string;
  date: string;
  duration: string;
  room: string;
  status: DoctorApptStatus;
  reason: string;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  title: string;
  kind: ReportKind;
  date: string;
  source: VerificationSource;
  summary: string;
  reviewed: boolean;
}

export interface Diagnosis {
  id: string;
  patientId: string;
  code: string;
  label: string;
  date: string;
  status: 'active' | 'resolved';
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  date: string;
  body: string;
  author: string;
}

export interface RxLine {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface DoctorPrescription {
  id: string;
  patientId: string;
  date: string;
  lines: RxLine[];
  notes: string;
  followUp?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  appointmentId?: string;
  status: ConsultStatus;
  startedAt?: string;
  completedAt?: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  followUp: string;
  labs: string[];
  prescriptionId?: string;
}

export interface DoctorNotice {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: 'appointment' | 'lab' | 'message' | 'followup' | 'record';
  href: string;
  read?: boolean;
}

export interface FollowUp {
  id: string;
  patientId: string;
  due: string;
  reason: string;
}
