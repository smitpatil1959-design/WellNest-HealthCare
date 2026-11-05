import supabase from './db-client.js';
import { verifyAuth } from './auth-guard.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });
  if (auth.role !== 'patient') return res.status(403).json({ success: false, error: 'Patient account required.' });

  try {
    const { data, error } = await supabase.from('profiles')
      .select('id, full_name, professional_title, specialty, organization')
      .eq('role', 'doctor').eq('role_verified', true).order('full_name');
    if (error) throw error;
    return res.status(200).json(data ?? []);
  } catch (err) {
    console.error("[doctors GET error]", err?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Verified doctor directory is unavailable.' });
  }
}
