import supabase from '../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../auth-guard.js';
import { findActiveGrant, grantAllowsCategory,authorizedPatientIds } from '../consent.js';
import { getActiveMembership, writeAudit } from '../organization-context.js';

const roles = ['insurance_admin', 'insurance_reviewer', 'insurance_policy_manager', 'insurance_support', 'insurance_auditor'];
const columns = 'id,organization_id,patient_user_id,insurance_plan_id,service_date,service_type,amount,status,reviewer_id,decision_reason,created_at,updated_at';
function cors(res) { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.setHeader('Content-Type', 'application/json'); }

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['insurance'])) return res.status(403).json({ success: false, error: 'Verified insurer account required.' });
  try {
    const org = await getActiveMembership(auth, roles);
    if (!org) return res.status(403).json({ success: false, error: 'Active verified insurer membership required.' });
    if (req.method === 'GET') {
      const patients=await authorizedPatientIds(auth.userId,'authorized claims');
      if(!patients.length)return res.status(200).json([]);
      const { data, error } = await supabase.from('insurance_claims').select(columns).eq('organization_id', org.organization.id).in('patient_user_id',patients).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data ?? []);
    }
    if (!['insurance_admin', 'insurance_policy_manager', 'insurance_support'].includes(org.membership.role)) return res.status(403).json({ success: false, error: 'Insurer claim creation authorization required.' });
    const body = req.body || {};
    const healthId = typeof body.healthId === 'string' ? body.healthId.trim().toUpperCase() : '';
    const amount = Number(body.amount);
    if (!/^[A-Z0-9-]{4,24}$/.test(healthId) || typeof body.serviceType !== 'string' || !body.serviceType.trim() || !Number.isFinite(amount) || amount < 0) return res.status(400).json({ success: false, error: 'healthId, serviceType and a valid amount are required.' });
    const { data: identity, error: identityError } = await supabase.from('health_identities').select('user_id').eq('health_id', healthId).maybeSingle();
    if (identityError) throw identityError;
    if (!identity) return res.status(404).json({ success: false, error: 'Patient Health ID was not found.' });
    const grant = await findActiveGrant(identity.user_id, auth.userId);
    if (!grant || !grantAllowsCategory(grant, 'authorized claims')) return res.status(403).json({ success: false, error: 'Active claims authorization is required.' });
    const { data, error } = await supabase.from('insurance_claims').insert({ organization_id: org.organization.id, patient_user_id: identity.user_id, insurance_plan_id: body.policyId || null, service_date: body.serviceDate || null, service_type: body.serviceType.trim(), amount, status: 'new' }).select(columns).single();
    if (error) throw error;
    await writeAudit(auth, 'insurance_claim_created', 'insurance_claim', data.id, org.organization.id, 'ok');
    return res.status(201).json(data);
  } catch (error) {
    console.error("[insurance claims error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Insurance claim service is unavailable.' });
  }
}
