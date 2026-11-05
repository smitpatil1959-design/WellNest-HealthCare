export const USER_ROLES = [
  'patient',
  'doctor',
  'hospital',
  'laboratory',
  'pharmacy',
  'insurance',
  'administrator',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface RoleCapability {
  id: string;
  title: string;
  description: string;
}

export interface RoleDefinition {
  id: UserRole;
  label: string;
  headline: string;
  description: string;
  audience: string;
  path: string;
  accent: string;
  capabilities: RoleCapability[];
  records: string[];
}

export interface RoleSessionPreview {
  role: UserRole;
  displayName: string;
  organization?: string;
  verified: boolean;
}

export function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().toLowerCase().replace(/[-_\s]+/g, '_');

  if (cleaned === 'patient' || cleaned === 'patients') return 'patient';
  if (cleaned === 'doctor' || cleaned === 'doctors' || cleaned === 'doc' || cleaned === 'physician' || cleaned === 'clinician') return 'doctor';
  if (cleaned === 'hospital' || cleaned === 'hospitals' || cleaned === 'clinic' || cleaned === 'hospital_admin') return 'hospital';
  if (cleaned === 'laboratory' || cleaned === 'laboratories' || cleaned === 'lab' || cleaned === 'labs') return 'laboratory';
  if (cleaned === 'pharmacy' || cleaned === 'pharmacies' || cleaned === 'pharm' || cleaned === 'pharmacist' || cleaned === 'chemist') return 'pharmacy';
  if (cleaned === 'insurance' || cleaned === 'insurer' || cleaned === 'payer') return 'insurance';
  if (
    cleaned === 'administrator' ||
    cleaned === 'admin' ||
    cleaned === 'super_admin' ||
    cleaned === 'superadmin' ||
    cleaned === 'system_admin'
  ) {
    return 'administrator';
  }

  return null;
}

export function isValidUserRole(value: unknown): value is UserRole {
  return normalizeRole(value) !== null;
}
