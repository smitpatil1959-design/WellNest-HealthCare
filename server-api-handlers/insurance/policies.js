import supabase from '../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../auth-guard.js';
import { findActiveGrant, grantAllowsCategory,authorizedPatientIds } from '../consent.js';
import { getActiveMembership, writeAudit } from '../organization-context.js';

const roles = ['insurance_admin', 'insurance_policy_manager', 'insurance_reviewer', 'insurance_support', 'insurance_auditor'];
const columns = 'id,patient_id,insurer_id,plan_name,policy_number,coverage_type,coverage_limit,deductible,valid_from,valid_to,status,created_at';

function cors(res) { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.setHeader('Content-Type', 'application/json'); }

async function context(auth) {
  if (!hasVerifiedRole(auth, ['insurance'])) return null;
  return getActiveMembership(auth, roles);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  try {
    const org = await context(auth);
    if (!org) return res.status(403).json({ success: false, error: 'Active verified insurer membership required.' });
    if (req.method === 'GET') {
      const patientIds = await authorizedPatientIds(auth.userId,'authorized claims');
      if (!patientIds.length) return res.status(200).json([]);
      const { data, error } = await supabase.from('insurance_plans').select(columns).in('patient_id', patientIds).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data ?? []);
    }
    const policyId = String(req.query?.id || req.body?.policyId || '').trim();
    if (req.method === 'PATCH') {
      if (!policyId || !['insurance_admin', 'insurance_policy_manager'].includes(org.membership.role)) return res.status(403).json({ success: false, error: 'Policy manager authorization required.' });
      const { status } = req.body || {};
      if (!['active', 'pending', 'expired', 'suspended'].includes(status)) return res.status(400).json({ success: false, error: 'Invalid policy status.' });
      const existing=await supabase.from('insurance_plans').select('patient_id').eq('id',policyId).eq('insurer_id',auth.userId).maybeSingle();
      if(existing.error)throw existing.error;
      if(!existing.data)return res.status(404).json({error:'Policy not found.'});
      const grant=await findActiveGrant(existing.data.patient_id,auth.userId);
      if(!grant||!grantAllowsCategory(grant,'authorized claims'))return res.status(403).json({error:'Active insurance authorization is required.'});
      const { data, error } = await supabase.from('insurance_plans').update({ status }).eq('id', policyId).eq('insurer_id', auth.userId).select(columns).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, error: 'Policy not found.' });
      await writeAudit(auth, 'insurance_policy_status_changed', 'insurance_plan', data.id, org.organization.id, 'ok', { status });
      return res.status(200).json(data);
    }
    if (!['insurance_admin', 'insurance_policy_manager'].includes(org.membership.role)) return res.status(403).json({ success: false, error: 'Policy manager authorization required.' });
    const body = req.body || {};
    const healthId = typeof body.healthId === 'string' ? body.healthId.trim().toUpperCase() : '';
    if (!/^[A-Z0-9-]{4,24}$/.test(healthId) || typeof body.planName !== 'string' || !body.planName.trim() || typeof body.policyNumber !== 'string' || !body.policyNumber.trim()) {
      return res.status(400).json({ success: false, error: 'healthId, planName and policyNumber are required.' });
    }
    const { data: identity, error: identityError } = await supabase.from('health_identities').select('user_id').eq('health_id', healthId).maybeSingle();
    if (identityError) throw identityError;
    if (!identity) return res.status(404).json({ success: false, error: 'Patient Health ID was not found.' });
    const grant = await findActiveGrant(identity.user_id, auth.userId);
    if (!grant || !grantAllowsCategory(grant, 'authorized claims')) return res.status(403).json({ success: false, error: 'Active insurance authorization is required.' });
    const { data, error } = await supabase.from('insurance_plans').insert({ patient_id: identity.user_id, insurer_id: auth.userId, plan_name: body.planName.trim(), policy_number: body.policyNumber.trim(), coverage_type: typeof body.coverageType === 'string' ? body.coverageType.trim() : '', coverage_limit: Number(body.coverageLimit) || 0, deductible: Number(body.deductible) || 0, valid_from: body.validFrom || null, valid_to: body.validTo || null, status: 'pending' }).select(columns).single();
    if (error) throw error;
    await writeAudit(auth, 'insurance_policy_created', 'insurance_plan', data.id, org.organization.id, 'ok');
    return res.status(201).json(data);
  } catch (error) {
    console.error("[insurance policies error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Insurance policy service is unavailable.' });
  }
}
