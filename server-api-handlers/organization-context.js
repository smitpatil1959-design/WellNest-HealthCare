import supabase from './db-client.js';
import { hasVerifiedRole } from './auth-guard.js';

export const ORGANIZATION_KINDS = Object.freeze(['hospital', 'laboratory', 'pharmacy', 'insurance']);

export async function getActiveMembership(auth, allowedRoles = []) {
  if (!hasVerifiedRole(auth, ['doctor', 'hospital', 'laboratory', 'pharmacy', 'insurance'])) return null;
  const { data, error } = await supabase.from('organization_memberships')
    .select('id,organization_id,user_id,role,status,verified_at,created_at,updated_at,organizations(id,kind,legal_name,display_name,registration_number,status,verified_at,verified_by,created_at,updated_at)')
    .eq('user_id', auth.userId)
    .eq('status', 'active')
    .not('verified_at', 'is', null)
    .maybeSingle();
  if (error) throw error;
  if (!data || (allowedRoles.length && !allowedRoles.includes(data.role))) return null;
  const organization = data.organizations;
  if (!organization || organization.status !== 'verified') return null;
  return { membership: data, organization };
}

export function auditPayload(auth, action, targetType, targetId, organizationId, result, metadata = {}) {
  return {
    actor_user_id: auth.userId,
    organization_id: organizationId || null,
    action,
    target_type: targetType,
    target_id: targetId ? String(targetId) : null,
    result,
    metadata,
    created_at: new Date().toISOString(),
  };
}

export async function writeAudit(auth, action, targetType, targetId, organizationId, result, metadata = {}) {
  const { error } = await supabase.from('audit_events').insert(
    auditPayload(auth, action, targetType, targetId, organizationId, result, metadata),
  );
  if (error) throw error;
}
