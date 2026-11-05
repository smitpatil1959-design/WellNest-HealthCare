import supabase from '../../../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../../../auth-guard.js';
import { getLabContext, auditLab } from '../../context.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['laboratory'])) return res.status(403).json({ success: false, error: 'Verified laboratory account required.' });
  try {
    const context = await getLabContext(auth, ['laboratory_admin', 'laboratory_director', 'laboratory_pathologist']);
    if (!context) return res.status(403).json({ success: false, error: 'Pathologist or laboratory director authorization required.' });
    const id = String(req.query?.id || '').trim();
    const { data, error } = await supabase.from('lab_report_versions').update({
      status: 'verified', verified_by: auth.userId, verified_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', id).eq('organization_id', context.organization.id).in('status', ['draft', 'awaiting-verify'])
      .select('id,lab_order_id,organization_id,patient_user_id,version,status,impression,analytes,critical,verified_by,verified_at,released_by,released_at,supersedes_id,created_at,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Unverified report version not found.' });
    await auditLab(auth, 'lab_report_verified', 'lab_report_version', data.id, context.organization.id, { version: data.version });
    return res.status(200).json(data);
  } catch (error) {
    console.error("[lab report verify error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Laboratory report verification is unavailable.' });
  }
}
