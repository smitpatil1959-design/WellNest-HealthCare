import supabase from './db-client.js';
import { verifyAuth } from './auth-guard.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('user_id,email,sms,product,updated_at')
        .eq('user_id', auth.userId)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json({ success: true, preferences: data ?? null });
    } catch (err) {
      console.error("[notifications GET error]", err?.code || 'UNAVAILABLE');
      return res.status(503).json({ success: false, error: 'Notification preference storage is unavailable.' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body || {};
      const fields = ['email', 'sms', 'product'];
      if (fields.some((field) => typeof body[field] !== 'boolean')) {
        return res.status(400).json({ success: false, error: 'email, sms and product must be boolean values.' });
      }
      const { error } = await supabase.from('notification_preferences').upsert({
        user_id: auth.userId,
        email: body.email,
        sms: body.sms,
        product: body.product,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Notification preferences could not be saved.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
