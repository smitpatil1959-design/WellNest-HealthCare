import supabase from './db-client.js';
import { verifyAuth, hasVerifiedRole } from './auth-guard.js';
import { ORGANIZATION_KINDS, writeAudit } from './organization-context.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ success: false, error: 'Method not allowed' });

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const isAdmin = hasVerifiedRole(auth, ['administrator']);
      let query = supabase.from('organizations')
        .select('id,kind,legal_name,display_name,registration_number,status,created_at')
        .order('display_name', { ascending: true });

      if (!isAdmin) {
        query = query.eq('status', 'verified');
      }

      if (typeof req.query?.kind === 'string' && ORGANIZATION_KINDS.includes(req.query.kind)) {
        query = query.eq('kind', req.query.kind);
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data ?? []);
    }

    const body = req.body || {};
    const kind = body.kind;
    const legalName = typeof body.legalName === 'string' ? body.legalName : (typeof body.legal_name === 'string' ? body.legal_name : '');
    const displayName = typeof body.displayName === 'string' ? body.displayName : (typeof body.display_name === 'string' ? body.display_name : '');
    const registrationNumber = typeof body.registrationNumber === 'string' ? body.registrationNumber : (typeof body.registration_number === 'string' ? body.registration_number : null);

    if (!ORGANIZATION_KINDS.includes(kind) || !legalName.trim() || !displayName.trim()) {
      return res.status(400).json({ success: false, error: 'kind, legalName and displayName are required.' });
    }

    // Security: never trust client/browser to directly create a verified organization.
    // Client cannot override status to verified. All client creations are pending.
    const { data, error } = await supabase.from('organizations').insert({
      kind,
      legal_name: legalName.trim(),
      display_name: displayName.trim(),
      registration_number: registrationNumber && registrationNumber.trim() ? registrationNumber.trim() : null,
      status: 'pending',
    }).select('id,kind,legal_name,display_name,registration_number,status,created_at').single();

    if (error) throw error;
    await writeAudit(auth, 'organization_submitted', 'organization', data.id, data.id, 'ok');
    return res.status(201).json(data);
  } catch (error) {
    console.error("[organizations error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Organization service is unavailable.' });
  }
}
