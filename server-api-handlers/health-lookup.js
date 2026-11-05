import supabase from './db-client.js';
import { hasVerifiedRole, VERIFIED_STAFF_ROLES, verifyAuth } from './auth-guard.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });
    if (!hasVerifiedRole(auth, [...VERIFIED_STAFF_ROLES, 'administrator'])) {
      return res.status(403).json({ success: false, error: 'A verified provider account is required.' });
    }
    const body = req.body || {};

    const actorId = auth.userId;
    const actorName = auth.fullName;
    const actorRole = auth.role;
    const organization = auth.organization || '';

    const rawId = String(body.healthId || '').trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,24}$/.test(rawId)) {
      return res.status(400).json({ success: false, error: 'Enter a valid Health ID (e.g., VY-7K42-91PM)' });
    }

    // 1. Check database health_identities
    let found = null;
    const { data, error: lookupError } = await supabase
      .from('health_identities')
      .select('health_id, display_name, city')
      .eq('health_id', rawId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (data) found = {
      healthId: data.health_id,
      displayName: data.display_name,
      city: data.city || '',
    };

    // 3. Log audit event
    const { error: auditError } = await supabase.from('health_audit_logs').insert({
        actor_id: actorId,
        actor_name: actorName,
        actor_role: actorRole,
        organization: organization,
        action: 'health_id_lookup',
        health_id: rawId,
        result: found ? 'ok' : 'miss',
        created_at: new Date().toISOString(),
      });
    if (auditError) throw auditError;

    if (!found) {
      return res.status(404).json({ success: false, error: `No patient found matching Health ID ${rawId}` });
    }

    return res.status(200).json({
      success: true,
      ...found,
    });
  } catch (err) {
    console.error("[health-lookup handler error]", err?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Health ID lookup is unavailable.' });
  }
}
