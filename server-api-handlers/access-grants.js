import supabase from './db-client.js';
import { hasVerifiedRole, VERIFIED_STAFF_ROLES, verifyAuth } from './auth-guard.js';
import { getActiveMembership } from './organization-context.js';

const patientGrantColumns = 'id,requester_name,organization,categories,status,expires_at,created_at';
const requesterGrantColumns = 'id,patient_name,categories,status,expires_at';
const administratorGrantColumns = 'id,patient_name,requester_name,requester_role,organization,categories,status,expires_at,created_at';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
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
      let columns = administratorGrantColumns;
      if (auth.role === 'patient') columns = patientGrantColumns;
      else if (hasVerifiedRole(auth, VERIFIED_STAFF_ROLES)) {
        if (auth.role === 'doctor') {
          const docContext = await getActiveMembership(auth, ['doctor']);
          if (!docContext) return res.status(403).json({ success: false, error: 'Active verified doctor organization membership required.' });
        }
        columns = requesterGrantColumns;
      }
      let query = supabase.from('access_grants').select(columns).order('created_at', { ascending: false });
      if (auth.role === 'administrator') {
        if (req.query.patientUserId) query = query.eq('patient_user_id', req.query.patientUserId);
        if (req.query.requesterId) query = query.eq('requester_id', req.query.requesterId);
      } else if (auth.role === 'patient') {
        query = query.eq('patient_user_id', auth.userId);
      } else if (hasVerifiedRole(auth, VERIFIED_STAFF_ROLES)) {
        query = query.eq('requester_id', auth.userId);
      } else {
        return res.status(403).json({ success: false, error: 'Access grants are unavailable for this account.' });
      }
      try {
        const { data, error } = await query;
        if (error) throw error;
        const now = Date.now();
        const normalized = (data || []).map((row) => {
          if (row.status === 'active' && row.expires_at && new Date(row.expires_at).getTime() < now) {
            return { ...row, status: 'expired' };
          }
          return row;
        });
        return res.status(200).json(normalized);
      } catch (dbErr) {
        console.warn('[access-grants DB notice]', dbErr.message);
        return res.status(503).json({ success: false, error: 'Access grant storage is unavailable.' });
      }
    }

    if (req.method === 'PUT') {
      const { id, healthId } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      if (auth.role !== 'patient' && auth.role !== 'administrator') {
        return res.status(403).json({ error: 'Only the patient can revoke this access grant.' });
      }

      const actorId = auth.userId;
      const actorName = auth.fullName;

      const { data: grant, error: fetchError } = await supabase.from('access_grants')
        .select('id,patient_user_id,health_id,status')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;
      if (auth.role !== 'administrator' && grant.patient_user_id !== auth.userId) {
        return res.status(403).json({ error: 'You are not authorized to revoke this grant.' });
      }
      if (grant.status !== 'active') return res.status(409).json({ error: 'This access grant is no longer active.' });

      const { data, error } = await supabase
        .from('access_grants')
        .update({ status: 'revoked', revoked_at: new Date().toISOString() })
        .eq('id', id)
        .select(auth.role === 'patient' ? patientGrantColumns : administratorGrantColumns)
        .single();
      if (error) throw error;

      try {
        await supabase.from('health_audit_logs').insert({
          actor_id: actorId,
          actor_name: actorName,
          actor_role: auth.role,
          organization: auth.organization || '',
          action: 'access_revoked',
          health_id: grant.health_id || healthId,
          result: 'ok',
          created_at: new Date().toISOString(),
        });
      } catch {
        // Audit log unprovisioned, safe to ignore
      }

      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error("access-grants error", err?.code || 'UNAVAILABLE');
    return res.status(500).json({ success: false, error: 'Access grant request could not be completed.' });
  }
}
