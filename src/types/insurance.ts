export type PolicyStatus = 'active' | 'pending' | 'expired' | 'suspended';
export type ClaimStatus = 'new' | 'documents' | 'review' | 'approved' | 'rejected' | 'paid';
export type ClaimDocSource = 'hospital' | 'laboratory' | 'pharmacy' | 'doctor' | 'patient';
export type InsurerStaffRole = 'admin' | 'reviewer' | 'policy-manager' | 'support' | 'auditor';

export interface InsurerOrg {
  name: string;
  legalName: string;
  naic: string;
  phone: string;
  hours: string;
  verified: boolean;
  logo: string;
}

export interface Dependent {
  name: string;
  relation: string;
  dob: string;
}

export interface CoverageLine {
  service: string;
  covered: string;
  remaining: string;
}

export interface InsurancePolicy {
  id: string;
  policyId: string;
  memberName: string;
  memberId: string;
  patientId: string;
  avatar: string;
  status: PolicyStatus;
  plan: string;
  effective: string;
  expires: string;
  deductible: string;
  deductibleMet: string;
  copay: string;
  dependents: Dependent[];
  coverage: CoverageLine[];
}

export interface ClaimDocument {
  id: string;
  title: string;
  type: 'bill' | 'lab' | 'prescription' | 'discharge' | 'policy' | 'support';
  source: ClaimDocSource;
  date: string;
  verified: boolean;
}

export interface InsuranceClaim {
  id: string;
  claimId: string;
  policyId: string;
  memberName: string;
  hospital: string;
  doctor: string;
  service: string;
  amount: number;
  status: ClaimStatus;
  submitted: string;
  documents: ClaimDocument[];
  notes: string[];
  flags: string[];
}

export interface InsuranceNotice {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: 'claim' | 'policy' | 'document' | 'fraud';
  href: string;
}
