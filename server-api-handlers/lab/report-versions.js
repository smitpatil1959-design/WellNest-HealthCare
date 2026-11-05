import supabase from '../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../auth-guard.js';
import { getLabContext, auditLab } from './context.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['laboratory'])) return res.status(403).json({ success: false, error: 'Verified laboratory account required.' });
  try {
    const context = await getLabContext(auth);
    if (!context) return res.status(403).json({ success: false, error: 'Active verified laboratory membership required.' });
    const { data, error } = await supabase.from('lab_report_versions')
      .select('id,lab_order_id,organization_id,patient_user_id,version,status,impression,analytes,critical,verified_by,verified_at,released_by,released_at,supersedes_id,created_at,updated_at,lab_orders(accession_number,test_kind,test_name,doctor_name,hospital_name)')
      .eq('organization_id', context.organization.id).order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    await auditLab(auth, 'lab_reports_viewed', 'lab_report_version', null, context.organization.id);
    return res.status(200).json(data ?? []);
  } catch (error) {
    console.error("[lab report versions GET error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Laboratory reports are unavailable.' });
  }
}
