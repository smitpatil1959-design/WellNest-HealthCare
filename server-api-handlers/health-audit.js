import supabase from './db-client.js';
import { verifyAuth } from './auth-guard.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });

    let query = supabase.from('health_audit_logs').select('id,actor_name,actor_role,organization,action,health_id,result,created_at').order('created_at', { ascending: false }).limit(80);
    if (auth.role === 'administrator') {
      if (req.query.healthId) query = query.eq('health_id', req.query.healthId);
    } else if (auth.role === 'patient') {
      const { data: identity, error: identityError } = await supabase
        .from('health_identities').select('health_id').eq('user_id', auth.userId).maybeSingle();
      if (identityError) throw identityError;
      if (!identity) return res.status(200).json([]);
      query = query.eq('health_id', identity.health_id);
    } else {
      query = query.eq('actor_id', auth.userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    console.error("health-audit error", err?.code || 'UNAVAILABLE');
    return res.status(500).json({ error: 'Audit log storage is unavailable.' });
  }
}
