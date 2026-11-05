import supabase from '../../../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../../../auth-guard.js';
import { getLabContext, auditLab } from '../../context.js';

const reportRoles = ['laboratory_admin', 'laboratory_director', 'laboratory_technologist'];

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
    const context = await getLabContext(auth, reportRoles);
    if (!context) return res.status(403).json({ success: false, error: 'Authorized laboratory report role required.' });
    const orderId = String(req.query?.id || '').trim();
    const body = req.body || {};
    if (!orderId || typeof body.impression !== 'string' || !Array.isArray(body.analytes)) {
      return res.status(400).json({ success: false, error: 'Order id, impression and analytes are required.' });
    }
    const { data: order, error: orderError } = await supabase.from('lab_orders')
      .select('id,organization_id,patient_user_id,status,priority').eq('id', orderId).eq('organization_id', context.organization.id).maybeSingle();
    if (orderError) throw orderError;
    if (!order) return res.status(404).json({ success: false, error: 'Laboratory order not found.' });
    const { data: latest, error: latestError } = await supabase.from('lab_report_versions')
      .select('version').eq('lab_order_id', order.id).order('version', { ascending: false }).limit(1).maybeSingle();
    if (latestError) throw latestError;
    const version = (latest?.version || 0) + 1;
    const { data, error } = await supabase.from('lab_report_versions').insert({
      lab_order_id: order.id,
      organization_id: order.organization_id,
      patient_user_id: order.patient_user_id,
      version,
      status: 'awaiting-verify',
      impression: body.impression.trim(),
      analytes: body.analytes,
      critical: Boolean(body.critical) || order.priority === 'critical',
    }).select('id,lab_order_id,organization_id,patient_user_id,version,status,impression,analytes,critical,verified_by,verified_at,released_by,released_at,supersedes_id,created_at,updated_at').single();
    if (error) throw error;
    await supabase.from('lab_orders').update({ status: 'awaiting-verify', updated_at: new Date().toISOString() }).eq('id', order.id).eq('organization_id', context.organization.id);
    await auditLab(auth, 'lab_report_drafted', 'lab_report_version', data.id, context.organization.id, { version });
    return res.status(201).json(data);
  } catch (error) {
    console.error("[lab report version create error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Laboratory report draft could not be saved.' });
  }
}
