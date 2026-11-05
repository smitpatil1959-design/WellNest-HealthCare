import supabase from './db-client.js';
import { verifyAuth } from './auth-guard.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });
  const userId = auth.userId;

  try {
    const { data, error } = await supabase
      .from('vaccinations')
      .select('id,vaccine_name,doses_given,administered_at,next_due_at,provider,notes,created_at')
      .eq('patient_id', userId)
      .order('administered_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json(data ?? []);
  } catch (err) {
    console.error("[vaccinations GET error]", err?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Vaccination storage is unavailable.' });
  }
}
