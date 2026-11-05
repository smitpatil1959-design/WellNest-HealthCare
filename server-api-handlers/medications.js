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
  const userId = auth.userId;

  if (req.method === 'PUT') {
    if (auth.role !== 'patient') return res.status(403).json({ success: false, error: 'Patient account required.' });
    const { id, taken } = req.body || {};
    if (!id || typeof taken !== 'boolean') return res.status(400).json({ success: false, error: 'id and boolean taken value are required.' });
    try {
      const { data, error } = await supabase.from('medications').update({
        taken,
        taken_at: taken ? new Date().toISOString() : null,
      }).eq('id', id).eq('patient_id', userId).select('id,name,dosage,time,taken,taken_at').maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, error: 'Medication entry not found.' });
      return res.status(200).json(data);
    } catch (err) {
      console.error("[medications PUT error]", err?.code || 'UNAVAILABLE');
      return res.status(503).json({ success: false, error: 'Medication update could not be saved.' });
    }
  }

  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { data, error } = await supabase
      .from('medications')
      .select('id,name,dosage,time,taken,taken_at')
      .eq('patient_id', userId)
      .order('time', { ascending: true });
    if (error) throw error;
    return res.status(200).json(data ?? []);
  } catch (err) {
    console.error("[medications GET error]", err?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Medication storage is unavailable.' });
  }
}
