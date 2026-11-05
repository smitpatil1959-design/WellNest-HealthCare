import supabase from '../../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../../auth-guard.js';
import { getLabContext, auditLab } from '../context.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'PATCH'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['laboratory'])) return res.status(403).json({ success: false, error: 'Verified laboratory account required.' });
  try {
    const context = await getLabContext(auth);
    if (!context) return res.status(403).json({ success: false, error: 'Active verified laboratory membership required.' });
    const id = String(req.query?.id || '').trim();
    if (!id) return res.status(400).json({ success: false, error: 'Order id is required.' });
    if (req.method === 'PATCH') {
      if (!['laboratory_admin', 'laboratory_director', 'laboratory_technologist'].includes(context.membership.role)) {
        return res.status(403).json({ success: false, error: 'Laboratory order status requires an authorized staff role.' });
      }
      const { status } = req.body || {};
      if (!['requested', 'pending', 'in-progress', 'resulted', 'awaiting-verify', 'published'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid laboratory order status.' });
      }
      const { data, error } = await supabase.from('lab_orders').update({ status, updated_at: new Date().toISOString() })
        .eq('id', id).eq('organization_id', context.organization.id)
        .select('id,organization_id,patient_user_id,ordering_user_id,accession_number,test_kind,test_name,priority,status,doctor_name,hospital_name,requested_at,collected_at,resulted_at,created_at,updated_at').maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, error: 'Laboratory order not found.' });
      await auditLab(auth, 'lab_order_status_changed', 'lab_order', data.id, context.organization.id, { status });
      return res.status(200).json(data);
    }
    const { data, error } = await supabase.from('lab_orders')
      .select('id,organization_id,patient_user_id,ordering_user_id,accession_number,test_kind,test_name,priority,status,doctor_name,hospital_name,requested_at,collected_at,resulted_at,created_at,updated_at')
      .eq('id', id).eq('organization_id', context.organization.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Laboratory order not found.' });
    await auditLab(auth, 'lab_order_viewed', 'lab_order', data.id, context.organization.id);
    return res.status(200).json(data);
  } catch (error) {
    console.error("[lab order detail error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Laboratory order is unavailable.' });
  }
}
