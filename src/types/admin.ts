export type PlatformRole =
  | 'patient'
  | 'doctor'
  | 'hospital'
  | 'laboratory'
  | 'pharmacy'
  | 'insurance'
  | 'administrator';

export type AccountStatus = 'active' | 'pending' | 'suspended';
export type OrgKind = 'hospital' | 'laboratory' | 'pharmacy' | 'insurance' | 'clinic';
export type OrgStatus = 'pending' | 'under-review' | 'verified' | 'rejected' | 'suspended';

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  organization: string;
  status: AccountStatus;
  verified: boolean;
  created: string;
  lastActive: string;
  avatar: string;
}

export interface PlatformOrg {
  id: string;
  name: string;
  kind: OrgKind;
  status: OrgStatus;
  registration: string;
  users: number;
  created: string;
  reviewer?: string;
  documents: string[];
}

export interface ActivityEvent {
  id: string;
  at: string;
  actor: string;
  role: string;
  organization: string;
  action: string;
  target: string;
  result: 'ok' | 'denied';
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: string;
  organization: string;
  action: string;
  record: string;
  result: 'ok' | 'denied';
}

export interface SecurityAlert {
  id: string;
  title: string;
  detail: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency: string;
}

export interface AdminNotice {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: 'org' | 'verify' | 'security' | 'system';
  href: string;
}

export interface PendingApplication {
  id: string;
  email: string;
  fullName: string;
  requestedRole: PlatformRole;
  requestedOrg: string;
  createdAt: string;
}
