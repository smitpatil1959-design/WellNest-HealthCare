import supabase from '../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../auth-guard.js';
import { getActiveMembership, writeAudit } from '../organization-context.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();

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

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('organization_memberships')
        .select('id,user_id,organization_id,role,status,verified_at,created_at,updated_at')
        .eq('organization_id', context.organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data ?? []);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      if (typeof body.userId !== 'string' || typeof body.role !== 'string') {
        return res.status(400).json({ success: false, error: 'userId and role are required.' });
      }
      const { data, error } = await supabase.from('organization_memberships').insert({
        user_id: body.userId,
        organization_id: context.organization.id,
        role: body.role,
        status: 'pending',
      }).select('id,user_id,organization_id,role,status,verified_at,created_at').single();
      if (error) throw error;
      await writeAudit(auth, 'membership_created', 'organization_membership', data.id, context.organization.id, 'ok');
      return res.status(201).json(data);
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error("[organizations/members error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Organization membership service is unavailable.' });
  }
}
