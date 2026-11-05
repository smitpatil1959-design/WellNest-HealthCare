import supabase from '../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../auth-guard.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const auth = await verifyAuth(req);
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['administrator'])) {
    return res.status(403).json({ success: false, error: 'Administrator authorization required.' });
  }

  const body = req.body || {};
  const applicantUserId = typeof body.applicantUserId === 'string' ? body.applicantUserId.trim() : '';
  const targetOrganizationId = typeof body.targetOrganizationId === 'string' ? body.targetOrganizationId.trim() : '';

  if (!UUID_REGEX.test(applicantUserId) || !UUID_REGEX.test(targetOrganizationId)) {
    return res.status(400).json({
      success: false,
      error: 'Valid applicantUserId and targetOrganizationId UUIDs are required.',
    });
  }

  try {
    const { data, error } = await supabase.rpc('approve_professional_applicant', {
      p_applicant_user_id: applicantUserId,
      p_target_organization_id: targetOrganizationId,
      p_acting_admin_user_id: auth.userId,
    });

    if (error) {
      console.warn('[approve-applicant RPC rejected]', error.message);
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, result: data });
  } catch (error) {
    console.error("[approve-applicant error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Professional approval service is unavailable.' });
  }
}
