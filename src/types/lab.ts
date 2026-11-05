export type LabTestKind =
  | 'blood'
  | 'urine'
  | 'pathology'
  | 'ecg'
  | 'xray'
  | 'ct'
  | 'mri'
  | 'ultrasound'
  | 'custom';

export type LabTestStatus = 'requested' | 'pending' | 'in-progress' | 'resulted' | 'awaiting-verify' | 'published';
export type LabStaffRole = 'director' | 'technologist' | 'pathologist' | 'receptionist';

export interface LabOrg {
  name: string;
  legalName: string;
  registration: string;
  clia: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  verified: boolean;
  logo: string;
  services: string[];
}

export interface LabOrder {
  id: string;
  accession: string;
  patientName: string;
  patientId: string;
  mrn: string;
  doctor: string;
  hospital: string;
  kind: LabTestKind;
  test: string;
  status: LabTestStatus;
  priority: 'routine' | 'stat' | 'critical';
  requested: string;
  collected?: string;
  resulted?: string;
}

export interface Analyte {
  name: string;
  value: string;
  unit: string;
  ref: string;
  flag?: 'H' | 'L' | 'C';
}

export interface AuditEvent {
  at: string;
  actor: string;
  action: string;
}

export interface LabReport {
  id: string;
  reportId: string;
  orderId: string;
  version: number;
  title: string;
  kind: LabTestKind;
  patientName: string;
  patientId: string;
  doctor: string;
  hospital: string;
  source: 'laboratory';
  status: 'draft' | 'awaiting-verify' | 'verified' | 'published' | 'superseded';
  verifier?: string;
  verifiedAt?: string;
  publishedAt?: string;
  impression: string;
  analytes: Analyte[];
  history: AuditEvent[];
  critical: boolean;
}

export interface LabNotice {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: 'request' | 'critical' | 'verify' | 'publish';
  href: string;
}
