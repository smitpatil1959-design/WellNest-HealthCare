import supabase from '../db-client.js';
import { verifyAuth, hasVerifiedRole } from '../auth-guard.js';

export function createAdminUsersHandler({ db = supabase, authenticate = verifyAuth } = {}) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (!['GET', 'PATCH'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
    const auth = await authenticate(req);
    if (!auth.authenticated) return res.status(auth.status || 401).json({ error: 'Sign in to continue.' });
    if (!hasVerifiedRole(auth, ['administrator'])) return res.status(403).json({ error: 'Verified administrator required.' });
    try {
      if (req.method === 'GET') {
        const { data, error } = await db.from('profiles').select('id,email,full_name,role,role_verified,organization,account_status,created_at').order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json((data || []).map(user => ({ id: user.id, email: user.email, name: user.full_name || '', role: user.role, organization: user.organization || '', verified: user.role_verified, status: user.account_status === 'suspended' ? 'suspended' : user.role !== 'patient' && !user.role_verified ? 'pending' : 'active', created: user.created_at, lastActive: '', avatar: '' })));
      }
      const { id, status } = req.body || {};
      if (!id || !['active', 'suspended'].includes(status)) return res.status(400).json({ error: 'Account and supported status are required.' });
      if (id === auth.userId) return res.status(400).json({ error: 'You cannot change your own account status.' });
      const { error } = await db.rpc('set_portal_account_status', { p_actor: auth.userId, p_target: id, p_status: status });
      if (error?.code === '42501') return res.status(403).json({ error: 'This account status cannot be changed here.' });
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[admin users]', error?.code || 'unavailable');
      return res.status(503).json({ error: 'User directory is unavailable. Check the database setup and retry.' });
    }
  };
}
export default createAdminUsersHandler();
