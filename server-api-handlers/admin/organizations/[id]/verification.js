import supabase from '../../../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../../../auth-guard.js';
import { writeAudit } from '../../../organization-context.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['administrator'])) return res.status(403).json({ success: false, error: 'Administrator authorization required.' });

  try {
    const id = String(req.query?.id || req.body?.id || '').trim();
    const { status } = req.body || {};
    if (!id || !['pending', 'verified', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, error: 'A valid organization id and status are required.' });
    }
    const updates = {
      status,
      verified_at: status === 'verified' ? new Date().toISOString() : null,
      verified_by: status === 'verified' ? auth.userId : null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('organizations').update(updates)
      .eq('id', id).select('id,kind,legal_name,display_name,status,verified_at,verified_by,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Organization not found.' });
    await writeAudit(auth, 'organization_verification_changed', 'organization', data.id, data.id, 'ok', { status });
    return res.status(200).json(data);
  } catch (error) {
    console.error("[admin organization verification error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Organization verification is unavailable.' });
  }
}
