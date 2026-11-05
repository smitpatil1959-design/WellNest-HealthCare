import supabase from '../../../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../../../auth-guard.js';
import { getActiveMembership, writeAudit } from '../../../organization-context.js';
import {findActiveGrant,grantAllowsCategory} from '../../../consent.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PATCH') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['insurance'])) return res.status(403).json({ success: false, error: 'Verified insurer account required.' });
  try {
    const org = await getActiveMembership(auth, ['insurance_admin', 'insurance_reviewer']);
    if (!org) return res.status(403).json({ success: false, error: 'Insurer reviewer authorization required.' });
    const id = String(req.query?.id || '').trim();
    const { status, decisionReason } = req.body || {};
    if (!id || !['review', 'approved', 'rejected', 'paid'].includes(status)) return res.status(400).json({ success: false, error: 'Valid claim id and review status are required.' });
    const existing=await supabase.from('insurance_claims').select('patient_user_id').eq('id',id).eq('organization_id',org.organization.id).maybeSingle();
    if(existing.error)throw existing.error;
    if(!existing.data)return res.status(404).json({error:'Claim not found.'});
    const grant=await findActiveGrant(existing.data.patient_user_id,auth.userId);
    if(!grant||!grantAllowsCategory(grant,'authorized claims'))return res.status(403).json({error:'Active claims authorization is required.'});
    const { data, error } = await supabase.from('insurance_claims').update({ status, reviewer_id: auth.userId, decision_reason: typeof decisionReason === 'string' ? decisionReason.trim() : null, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', org.organization.id).select('id,organization_id,patient_user_id,insurance_plan_id,service_date,service_type,amount,status,reviewer_id,decision_reason,created_at,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Claim not found.' });
    await writeAudit(auth, 'insurance_claim_reviewed', 'insurance_claim', data.id, org.organization.id, 'ok', { status });
    return res.status(200).json(data);
  } catch (error) {
    console.error("[insurance claim review error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Insurance claim review is unavailable.' });
  }
}
