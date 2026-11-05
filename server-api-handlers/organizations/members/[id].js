import supabase from '../../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../../auth-guard.js';
import { getActiveMembership, writeAudit } from '../../organization-context.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['hospital', 'laboratory', 'pharmacy', 'insurance'])) {
    return res.status(403).json({ success: false, error: 'Verified organization account required.' });
  }

  try {
    const context = await getActiveMembership(auth);
    if (!context || !['hospital_admin', 'laboratory_admin', 'pharmacy_admin', 'insurance_admin'].includes(context.membership.role)) {
      return res.status(403).json({ success: false, error: 'Organization administrator membership required.' });
    }
    const id = String(req.query?.id || '').trim();
    const { status, role } = req.body || {};
    if (!id || !['pending', 'active', 'suspended', 'revoked'].includes(status)) {
      return res.status(400).json({ success: false, error: 'A valid membership id and status are required.' });
    }
    const updates = { status, updated_at: new Date().toISOString() };
    if (role !== undefined) {
      if (typeof role !== 'string' || !role.trim()) return res.status(400).json({ success: false, error: 'A valid membership role is required.' });
      updates.role = role.trim();
    }
    const { data, error } = await supabase.from('organization_memberships').update(updates)
      .eq('id', id).eq('organization_id', context.organization.id)
      .select('id,user_id,organization_id,role,status,verified_at,created_at,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Membership not found.' });
    await writeAudit(auth, 'membership_updated', 'organization_membership', data.id, context.organization.id, 'ok', { status });
    return res.status(200).json(data);
  } catch (error) {
    console.error("[organizations/members/:id error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Organization membership could not be updated.' });
  }
}
