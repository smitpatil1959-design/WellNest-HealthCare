import supabase from './db-client.js';
import { hasVerifiedRole, VERIFIED_STAFF_ROLES, verifyAuth } from './auth-guard.js';
import { consentCategoriesForRole } from '../shared/consent-categories.js';
import { getActiveMembership } from './organization-context.js';

const REQUESTER_ROLES = [...VERIFIED_STAFF_ROLES, 'administrator'];
const patientRequestColumns = 'id,requester_name,organization,purpose,categories,duration_hours,status,created_at,decided_at';
const requesterRequestColumns = 'id,patient_name,organization,purpose,categories,status,created_at,decided_at';
const administratorRequestColumns = 'id,patient_name,requester_name,requester_role,organization,purpose,categories,duration_hours,status,created_at,decided_at';
const requestDecisionColumns = 'id,patient_user_id,health_id,patient_name,requester_id,requester_name,requester_role,organization,categories,duration_hours,status';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });

    if (req.method === 'GET') {
      let columns = administratorRequestColumns;
      if (auth.role === 'patient') columns = patientRequestColumns;
      else if (hasVerifiedRole(auth, REQUESTER_ROLES)) {
        if (auth.role === 'doctor') {
          const docContext = await getActiveMembership(auth, ['doctor']);
          if (!docContext) return res.status(403).json({ success: false, error: 'Active verified doctor organization membership required.' });
        }
        columns = requesterRequestColumns;
      }
      let query = supabase.from('access_requests').select(columns).order('created_at', { ascending: false });
      if (auth.role === 'administrator') {
        if (req.query.patientUserId) query = query.eq('patient_user_id', req.query.patientUserId);
        if (req.query.requesterId) query = query.eq('requester_id', req.query.requesterId);
      } else if (auth.role === 'patient') {
        query = query.eq('patient_user_id', auth.userId);
      } else if (hasVerifiedRole(auth, REQUESTER_ROLES)) {
        query = query.eq('requester_id', auth.userId);
      } else {
        return res.status(403).json({ success: false, error: 'Access requests are unavailable for this account.' });
      }
      try {
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data || []);
      } catch (dbErr) {
        console.warn('[access-requests DB notice]', dbErr.code || 'UNAVAILABLE');
        return res.status(503).json({ success: false, error: 'Access request storage is unavailable.' });
      }
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      if (!hasVerifiedRole(auth, REQUESTER_ROLES)) {
        return res.status(403).json({ error: 'A verified provider account is required.' });
      }
      const requesterId = auth.userId;
      const requesterName = auth.fullName;
      const requesterRole = auth.role;
      let organization = auth.organization || '';

      if (auth.role === 'doctor') {
        const docContext = await getActiveMembership(auth, ['doctor']);
        if (!docContext) return res.status(403).json({ error: 'Active verified doctor organization membership required.' });
        organization = docContext.organization.display_name;
      }

      if (typeof body.healthId !== 'string' || !body.healthId.trim()) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const healthId = body.healthId.trim().toUpperCase();
      const { data: identity, error: identityError } = await supabase
        .from('health_identities')
        .select('user_id, display_name')
        .eq('health_id', healthId)
        .maybeSingle();
      if (identityError) throw identityError;
      if (!identity) return res.status(404).json({ error: 'No patient was found for this Health ID.' });

      const { data, error } = await supabase
        .from('access_requests')
        .insert({
          health_id: healthId,
          patient_user_id: identity.user_id,
          patient_name: identity.display_name,
          requester_id: requesterId,
          requester_name: requesterName,
          requester_role: requesterRole,
          organization,
          purpose: body.purpose || 'Clinical care',
          // Scope is derived from the verified role; browser-supplied categories
          // cannot widen the grant created after patient approval.
          categories: consentCategoriesForRole(requesterRole),
          duration_hours: Math.min(720, Math.max(1, Number(body.durationHours) || 72)),
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select('id,status,created_at')
        .single();
      if (error) throw error;

      try {
        await supabase.from('health_audit_logs').insert({
          actor_id: requesterId,
          actor_name: requesterName,
          actor_role: requesterRole,
          organization,
          action: 'access_requested',
          health_id: healthId,
          result: 'ok',
          created_at: new Date().toISOString(),
        });
      } catch {
        // Audit log unprovisioned, safe to ignore
      }

      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body || {};
      if (!id || !['approved', 'denied'].includes(status)) {
        return res.status(400).json({ error: 'id and approved/denied status required' });
      }

      const actorId = auth.userId;

      const { data: request, error: fetchError } = await supabase.from('access_requests')
        .select(requestDecisionColumns)
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      // Only the patient who owns this request, or a trusted administrator, can decide it.
      if (auth.role !== 'administrator' && (auth.role !== 'patient' || request.patient_user_id !== auth.userId)) {
        return res.status(403).json({ error: 'You are not authorized to decide this access request' });
      }
      if (request.status !== 'pending') return res.status(409).json({ error: 'This request has already been decided.' });

      const result=await supabase.rpc('decide_access_request',{p_request:id,p_actor:actorId,p_status:status});
      if(['PT409','40001'].includes(result.error?.code))return res.status(409).json({error:'This request has already been decided.'});
      if(result.error?.code==='42501')return res.status(403).json({error:'You cannot decide this access request.'});
      if(result.error)throw result.error;
      const columns=(auth.role==='patient'?patientRequestColumns:administratorRequestColumns).split(',');
      const data=Object.fromEntries(columns.map(column=>[column,result.data[column]]));
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error("access-requests error", err?.code || 'UNAVAILABLE');
    return res.status(500).json({ success: false, error: 'Access request could not be completed.' });
  }
}
