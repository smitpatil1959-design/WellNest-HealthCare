import supabase from '../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../auth-guard.js';
import { ORGANIZATION_KINDS, writeAudit } from '../organization-context.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method not allowed' });

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['administrator'])) return res.status(403).json({ success: false, error: 'Administrator authorization required.' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('organizations')
        .select('id,kind,legal_name,display_name,registration_number,status,verified_at,verified_by,created_at,updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data ?? []);
    }

    if (req.method === 'PATCH') {
      const id = String(req.query?.id || req.body?.id || '').trim();
      const { status } = req.body || {};
      if (!id || !['pending', 'verified', 'rejected', 'suspended'].includes(status)) {
        return res.status(400).json({ success: false, error: 'A valid organization id and status are required.' });
      }
      const updates = {
        status,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
        verified_by: status === 'verified' ? auth.userId : null,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('organizations').update(updates)
        .eq('id', id).select('id,kind,legal_name,display_name,status,verified_at,verified_by,updated_at').maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, error: 'Organization not found.' });
      await writeAudit(auth, 'organization_verification_changed', 'organization', data.id, data.id, 'ok', { status });
      return res.status(200).json(data);
    }

    const body = req.body || {};
    const kind = body.kind;
    const legalName = typeof body.legalName === 'string' ? body.legalName : (typeof body.legal_name === 'string' ? body.legal_name : '');
    const displayName = typeof body.displayName === 'string' ? body.displayName : (typeof body.display_name === 'string' ? body.display_name : '');
    const registrationNumber = typeof body.registrationNumber === 'string' ? body.registrationNumber : (typeof body.registration_number === 'string' ? body.registration_number : null);

    if (!ORGANIZATION_KINDS.includes(kind) || !legalName.trim() || !displayName.trim()) {
      return res.status(400).json({ success: false, error: 'kind, legalName and displayName are required.' });
    }
    const { data, error } = await supabase.from('organizations').insert({
      kind,
      legal_name: legalName.trim(),
      display_name: displayName.trim(),
      registration_number: registrationNumber && registrationNumber.trim() ? registrationNumber.trim() : null,
      status: 'pending',
    }).select('id,kind,legal_name,display_name,registration_number,status,created_at').single();
    if (error) throw error;
    await writeAudit(auth, 'organization_created', 'organization', data.id, data.id, 'ok');
    return res.status(201).json(data);
  } catch (error) {
    console.error("[admin organizations error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Organization administration is unavailable.' });
  }
}
