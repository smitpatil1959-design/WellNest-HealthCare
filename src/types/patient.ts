export type RecordCategory =
  | 'lab'
  | 'imaging'
  | 'visit'
  | 'discharge'
  | 'prescription'
  | 'vaccination'
  | 'surgery'
  | 'upload';

export type RecordSource = 'verified' | 'uploaded' | 'unknown';
export type RecordStatus = 'verified' | 'pending' | 'released';
export type AppointmentStatus = 'upcoming' | 'completed' | 'canceled';
export type TimelineKind =
  | 'visit'
  | 'admission'
  | 'prescription'
  | 'lab'
  | 'vaccination'
  | 'surgery'
  | 'medication';
export type DoseSlot = 'morning' | 'afternoon' | 'night';
export type NoticeKind = 'report' | 'appointment' | 'medication' | 'consent' | 'insurance';

export interface MedicalRecord {
  id: string;
  title: string;
  category: RecordCategory;
  source: RecordSource;
  status: RecordStatus;
  date: string;
  hospital: string;
  doctor: string;
  laboratory?: string;
  summary: string;
  tags: string[];
}

export interface Appointment {
  id: string;
  title: string;
  doctor: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  reason: string;
  avatar: string;
}

export interface Prescription {
  id: string;
  medicine: string;
  dosage: string;
  duration: string;
  instructions: string;
  doctor: string;
  hospital: string;
  issued: string;
  refillsLeft: number;
  active: boolean;
}

export interface MedicationDose {
  id: string;
  name: string;
  dosage: string;
  slot: DoseSlot;
  time: string;
  prescriptionId: string;
}

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  title: string;
  date: string;
  organization: string;
  detail: string;
  recordId?: string;
}

export interface PatientDoctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  phone: string;
  nextVisit?: string;
  avatar: string;
}

export interface PatientHospital {
  id: string;
  name: string;
  campus: string;
  address: string;
  phone: string;
  lastVisit: string;
}

export interface Vaccination {
  id: string;
  name: string;
  dose: string;
  date: string;
  site: string;
  nextDue?: string;
}

export interface InsurancePlan {
  carrier: string;
  plan: string;
  memberId: string;
  groupId: string;
  status: 'active' | 'pending';
  effective: string;
  phone: string;
}

export interface PatientNotice {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  time: string;
  href: string;
}

export interface EmergencyProfile {
  bloodGroup: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  contactName: string;
  contactRelation: string;
  contactPhone: string;
  code: string;
}

export interface PatientIdentity {
  preferredName: string;
  legalName: string;
  dob: string;
  sex: string;
  city: string;
  phone: string;
  email: string;
  address: string;
  avatar: string;
  healthScore: number;
  healthLabel: string;
}
