import { hasVerifiedRole } from '../auth-guard.js';
import { getActiveMembership, writeAudit } from '../organization-context.js';

export const LAB_ROLES = Object.freeze([
  'laboratory_admin',
  'laboratory_director',
  'laboratory_pathologist',
  'laboratory_technologist',
  'laboratory_receptionist',
]);

export async function getLabContext(auth, roles = []) {
  if (!hasVerifiedRole(auth, ['laboratory'])) return null;
  return getActiveMembership(auth, roles.length ? roles : LAB_ROLES);
}

export async function auditLab(auth, action, targetType, targetId, organizationId, metadata = {}) {
  await writeAudit(auth, action, targetType, targetId, organizationId, 'ok', metadata);
}
