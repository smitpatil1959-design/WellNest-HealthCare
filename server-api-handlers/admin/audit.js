import supabase from '../db-client.js';
import { verifyAuth, hasVerifiedRole } from '../auth-guard.js';
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ error: 'Sign in to continue.' });
  if (!hasVerifiedRole(auth, ['administrator'])) return res.status(403).json({ error: 'Verified administrator required.' });
  const { data, error } = await supabase.from('audit_events').select('id,actor_user_id,organization_id,action,target_type,target_id,result,created_at').order('created_at', { ascending: false }).limit(500);
  if (error) return res.status(503).json({ error: 'Audit events are unavailable.' });
  return res.status(200).json((data || []).map(row => ({ id: String(row.id), at: row.created_at, actor: row.actor_user_id || 'System', role: '', organization: row.organization_id || '', action: row.action, record: `${row.target_type}: ${row.target_id || ''}`, result: row.result === 'ok' ? 'ok' : 'denied' })));
}
