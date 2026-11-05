import supabase from '../db-client.js';
import { hasVerifiedRole, verifyAuth } from '../auth-guard.js';

const PROFESSIONAL_ROLES = Object.freeze([
  'doctor',
  'laboratory',
  'hospital',
  'pharmacy',
  'insurance',
]);

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
  if (!auth.authenticated) return res.status(auth.status || 401).json({ success: false, error: 'Unauthorized' });
  if (!hasVerifiedRole(auth, ['administrator'])) {
    return res.status(403).json({ success: false, error: 'Administrator authorization required.' });
  }

  try {
    // 1. Fetch unverified profiles from database (role_verified must be false or null)
    const { data: unverifiedProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, role_verified, organization, created_at')
      .or('role_verified.eq.false,role_verified.is.null');

    if (profilesError) throw profilesError;

    const profileMap = new Map((unverifiedProfiles || []).map((p) => [p.id, p]));
    const pending = [];

    // 2. Discover requested roles from auth.users raw_user_meta_data / user_metadata via admin API
    try {
      const { data: userListData, error: listError } = await supabase.auth.admin.listUsers({
        perPage: 1000,
      });

      if (!listError && userListData?.users) {
        for (const u of userListData.users) {
          // Identify professional applicants using auth.users.raw_user_meta_data ->> 'requested_role'
          const metaRole = u.raw_user_meta_data?.requested_role || u.user_metadata?.requested_role;
          if (metaRole && PROFESSIONAL_ROLES.includes(metaRole)) {
            const prof = profileMap.get(u.id);
            // Require profiles.role_verified = false, do NOT require profiles.role = metaRole
            // because pending applicants intentionally remain patient until approval.
            if (prof && prof.role_verified !== true) {
              pending.push({
                id: u.id,
                email: u.email || prof.email || '',
                fullName: prof.full_name || u.user_metadata?.full_name || u.raw_user_meta_data?.full_name || 'Applicant',
                requestedRole: metaRole,
                requestedOrg: u.user_metadata?.organization || u.raw_user_meta_data?.organization || prof.organization || '',
                createdAt: u.created_at || prof.created_at || new Date().toISOString(),
              });
              profileMap.delete(u.id);
            }
          }
        }
      }
    } catch (adminErr) {
      console.warn('[pending-applications admin list fallback]', adminErr?.message || adminErr);
    }

    // 3. Include any profiles provisioned directly with unverified professional roles
    for (const [, prof] of profileMap) {
      if (PROFESSIONAL_ROLES.includes(prof.role) && prof.role_verified !== true) {
        pending.push({
          id: prof.id,
          email: prof.email || '',
          fullName: prof.full_name || 'Applicant',
          requestedRole: prof.role,
          requestedOrg: prof.organization || '',
          createdAt: prof.created_at || new Date().toISOString(),
        });
      }
    }

    return res.status(200).json(pending);
  } catch (error) {
    console.error("[pending-applications error]", error?.code || 'UNAVAILABLE');
    return res.status(503).json({ success: false, error: 'Pending applications service is unavailable.' });
  }
}
