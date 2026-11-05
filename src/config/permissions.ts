import type { UserRole } from '../types/roles';

export const PERMISSIONS = [
  'record:read:own',
  'record:read:consented',
  'record:issue:encounter',
  'record:issue:lab',
  'record:issue:fill',
  'consent:manage:own',
  'consent:request',
  'authorization:review',
  'org:manage',
  'credential:manage',
  'audit:read',
  'workspace:access',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const rolePermissions: Record<UserRole, Permission[]> = {
  patient: ['workspace:access', 'record:read:own', 'consent:manage:own'],
  doctor: ['workspace:access', 'record:read:consented', 'consent:request', 'record:issue:encounter'],
  hospital: ['workspace:access', 'record:read:consented', 'record:issue:encounter', 'org:manage'],
  laboratory: ['workspace:access', 'record:issue:lab', 'consent:request'],
  pharmacy: ['workspace:access', 'record:issue:fill', 'record:read:consented'],
  insurance: ['workspace:access', 'authorization:review', 'record:read:consented'],
  administrator: ['workspace:access', 'org:manage', 'credential:manage', 'audit:read'],
};

export function hasPermission(role: UserRole | null | undefined, permission: Permission) {
  if (!role) return false;
  return rolePermissions[role].includes(permission);
}

export function canAccessRoleDashboard(actor: UserRole | null | undefined, target: UserRole) {
  return actor === target;
}
