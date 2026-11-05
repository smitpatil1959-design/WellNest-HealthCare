import type { UserRole } from './roles';

export type AuthProviderKind = 'email' | 'google';

export interface AuthProfile {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  roleVerified?: boolean;
  organization: string;
  organizationId?: string;
  phone: string;
  language: string;
  avatarUrl: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  notifications: NotificationPrefs;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  bloodGroup?: string;
  allergies?: string[];
  conditions?: string[];
  medicationsList?: string[];
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  professionalTitle?: string;
  licenseNumber?: string;
  specialty?: string;
  onboardingCompleted?: boolean;
}

export interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  product: boolean;
}

export interface DeviceSession {
  id: string;
  label: string;
  browser: string;
  platform: string;
  current: boolean;
  lastActive: string;
  createdAt: string;
}

export interface AuthUserMetadata {
  full_name?: string;
  role?: UserRole | string;
  user_role?: string;
  roles?: string[];
  organization?: string;
  organization_id?: string;
  hospital_id?: string;
  phone?: string;
  language?: string;
  [key: string]: unknown;
}

export const AUTH_ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  hospital: 'Hospital',
  laboratory: 'Laboratory',
  pharmacy: 'Pharmacy',
  insurance: 'Insurance Provider',
  administrator: 'Super Admin',
};
