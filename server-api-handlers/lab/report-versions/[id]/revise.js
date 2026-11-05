import supabase from '../../../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../../../auth-guard.js';
import { getLabContext, auditLab } from '../../context.js';

const reportVersionColumns = 'id,lab_order_id,organization_id,patient_user_id,version,status,impression,analytes,critical,verified_by,verified_at,released_by,released_at,supersedes_id,created_at,updated_at';

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
    const context = await getLabContext(auth, ['laboratory_admin', 'laboratory_director', 'laboratory_technologist']);
    if (!context) return res.status(403).json({ success: false, error: 'Authorized laboratory report role required.' });
    const id = String(req.query?.id || '').trim();
    const { data: current, error: currentError } = await supabase.from('lab_report_versions')
      .select('id,lab_order_id,organization_id,patient_user_id,version,impression,analytes,critical')
      .eq('id', id).eq('organization_id', context.organization.id).maybeSingle();
    if (currentError) throw currentError;
    if (!current) return res.status(404).json({ success: false, error: 'Report version not found.' });
    const { data: next, error } = await supabase.from('lab_report_versions').insert({
      lab_order_id: current.lab_order_id,
      organization_id: current.organization_id,
      patient_user_id: current.patient_user_id,
      version: current.version + 1,
      status: 'draft',
      impression: current.impression,
      analytes: current.analytes,
      critical: current.critical,
      supersedes_id: current.id,
    }).select(reportVersionColumns).single();
    if (error) throw error;
    const { error: supersedeError } = await supabase.from('lab_report_versions').update({ status: 'superseded', updated_at: new Date().toISOString() }).eq('id', current.id);
    if (supersedeError) throw supersedeError;
    await auditLab(auth, 'lab_report_revision_created', 'lab_report_version', next.id, context.organization.id, { supersedesId: current.id });
    return res.status(201).json(next);
  } catch (error) {
    console.error("[lab report revision error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Laboratory report revision is unavailable.' });
  }
}
