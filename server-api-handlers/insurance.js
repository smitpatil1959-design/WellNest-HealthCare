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
      .from('insurance_plans')
      .select('id,plan_name,policy_number,coverage_type,coverage_limit,deductible,valid_from,valid_to,status,created_at')
      .eq('patient_id', userId)
      .maybeSingle();
    if (error) throw error;
    return res.status(200).json({ success: true, plan: data ?? null });
  } catch (err) {
    console.error("[insurance GET error]", err?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Insurance storage is unavailable.' });
  }
}
