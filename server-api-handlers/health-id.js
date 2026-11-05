import supabase from './db-client.js';
import { verifyAuth } from './auth-guard.js';
import { randomInt } from 'node:crypto';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

// Alphanumeric alphabet excluding ambiguous characters: 0, O, 1, I
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomHealthId() {
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i += 1) {
    part1 += ALPHABET[randomInt(ALPHABET.length)];
    part2 += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `VY-${part1}-${part2}`;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const auth = await verifyAuth(req);
    if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: auth.status === 503 ? auth.error : 'Unauthorized' });
    if (auth.role !== 'patient') return res.status(403).json({ success: false, error: 'A verified patient account is required.' });

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('health_identities')
        .select('id,user_id,health_id,display_name,city,created_at')
        .eq('user_id', auth.userId)
        .maybeSingle();
      if (error) return res.status(503).json({ success: false, error: 'Health ID storage is unavailable.' });
      if (!data) return res.status(404).json({ success: false, error: 'Health ID has not been issued yet.' });
      if (data.display_name !== auth.fullName) {
        const { data: updated, error: updateError } = await supabase.from('health_identities')
          .update({ display_name: auth.fullName }).eq('user_id', auth.userId).select().maybeSingle();
        if (updateError) return res.status(503).json({ success: false, error: 'Health ID profile could not be refreshed.' });
        if (updated) Object.assign(data, updated);
      }
      return res.status(200).json({
        success: true,
        health_id: data.health_id,
        display_name: data.display_name,
        city: data.city || '',
        created_at: data.created_at,
      });
    }

    if (req.method === 'POST') {
      const userId = auth.userId;
      const fullName = auth.fullName;

      const existing = await supabase
        .from('health_identities')
        .select('id,health_id,display_name,city,created_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (existing.error) return res.status(503).json({ success: false, error: 'Health ID storage is unavailable.' });
      if (existing.data) return res.status(200).json({ success: true, health_id: existing.data.health_id, display_name: existing.data.display_name, city: existing.data.city || '', created_at: existing.data.created_at });

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { data, error } = await supabase
          .from('health_identities')
          .insert({ user_id: userId, health_id: generateRandomHealthId(), display_name: fullName, city: '' })
          .select('id,health_id,display_name,city,created_at')
          .maybeSingle();
        if (!error && data) return res.status(201).json({ success: true, health_id: data.health_id, display_name: data.display_name, city: data.city || '', created_at: data.created_at });
        if (error?.code === '23505') {
          const concurrent = await supabase.from('health_identities').select('id,health_id,display_name,city,created_at').eq('user_id', userId).maybeSingle();
          if (concurrent.data) return res.status(200).json({ success: true, health_id: concurrent.data.health_id, display_name: concurrent.data.display_name, city: concurrent.data.city || '', created_at: concurrent.data.created_at });
          continue;
        }
        return res.status(503).json({ success: false, error: 'Health ID could not be saved.' });
      }
      return res.status(503).json({ success: false, error: 'A unique Health ID could not be issued. Please retry.' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error("[health-id handler error]", err?.code || 'UNAVAILABLE');
    return res.status(500).json({ success: false, error: 'Health ID service encountered an unexpected error.' });
  }
}
