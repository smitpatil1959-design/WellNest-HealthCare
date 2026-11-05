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
    if (!context) return res.status(403).json({ success: false, error: 'Authorized laboratory verifier required.' });
    const id = String(req.query?.id || '').trim();
    const { data: version, error } = await supabase.from('lab_report_versions')
      .select('id,patient_user_id,organization_id,critical,status').eq('id', id).eq('organization_id', context.organization.id).maybeSingle();
    if (error) throw error;
    if (!version) return res.status(404).json({ success: false, error: 'Report version not found.' });
    if (!version.critical) return res.status(400).json({ success: false, error: 'This report is not marked critical.' });
    const { error: notificationError } = await supabase.from('app_notifications').insert({
      recipient_id: version.patient_user_id,
      kind: 'critical_lab',
      title: 'Critical laboratory result',
      body: 'A critical laboratory result requires your attention.',
    });
    if (notificationError) throw notificationError;
    await auditLab(auth, 'lab_critical_notice', 'lab_report_version', version.id, context.organization.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[lab critical notice error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Critical-result notification is unavailable.' });
  }
}
