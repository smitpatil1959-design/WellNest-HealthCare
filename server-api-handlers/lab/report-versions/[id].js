import supabase from '../../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../../auth-guard.js';
import { getLabContext, auditLab } from '../context.js';

const reportColumns = 'id,lab_order_id,organization_id,patient_user_id,version,status,impression,analytes,critical,verified_by,verified_at,released_by,released_at,supersedes_id,created_at,updated_at';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['laboratory'])) return res.status(403).json({ success: false, error: 'Verified laboratory account required.' });
  try {
    const context = await getLabContext(auth, ['laboratory_admin', 'laboratory_director', 'laboratory_technologist']);
    if (!context) return res.status(403).json({ success: false, error: 'Authorized laboratory report role required.' });
    const id = String(req.query?.id || '').trim();
    const body = req.body || {};
    const updates = { updated_at: new Date().toISOString() };
    if (typeof body.impression === 'string') updates.impression = body.impression.trim();
    if (Array.isArray(body.analytes)) updates.analytes = body.analytes;
    if (typeof body.critical === 'boolean') updates.critical = body.critical;
    updates.status = 'awaiting-verify';
    const { data: current, error: currentError } = await supabase.from('lab_report_versions')
      .select('id,status,organization_id').eq('id', id).eq('organization_id', context.organization.id).maybeSingle();
    if (currentError) throw currentError;
    if (!current) return res.status(404).json({ success: false, error: 'Report version not found.' });
    if (!['draft', 'awaiting-verify'].includes(current.status)) return res.status(409).json({ success: false, error: 'Only an unverified report can be edited.' });
    const { data, error } = await supabase.from('lab_report_versions').update(updates)
      .eq('id', id).eq('organization_id', context.organization.id).select(reportColumns).single();
    if (error) throw error;
    await auditLab(auth, 'lab_report_edited', 'lab_report_version', data.id, context.organization.id);
    return res.status(200).json(data);
  } catch (error) {
    console.error("[lab report version update error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Laboratory report could not be updated.' });
  }
}
